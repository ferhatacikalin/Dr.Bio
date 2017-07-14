//ana oyun dosyası
  
window.addEventListener("load",function() {


var Q = window.Q = Quintus({audioSupported: [ 'wav','mp3','ogg' ]})
        .include("Sprites, Scenes, Input, 2D, Anim, Touch, UI, TMX, Audio")
        .setup({ maximize: true })
        .controls(true).touch()
        .enableSound()
        
;



Q.SPRITE_PLAYER = 1;
Q.SPRITE_COLLECTABLE = 2;
Q.Sprite.extend("Player",{

  init: function(p) {

    this._super(p, {
      sheet: "player",  // sprite* boy pos ayarlarını buradan yap
      sprite: "player",
      direction: "right",
      standingPoints: [ [ -16, 44], [ -23, 35 ], [-23,-48], [23,-48], [23, 35 ], [ 16, 44 ]],
      duckingPoints : [ [ -16, 44], [ -23, 35 ], [-23,-10], [23,-10], [23, 35 ], [ 16, 44 ]],
      jumpSpeed: -400,
      speed: 300,
      strength: 100,
      score: 0,
      renk:"green",
      srenk:"green",
      uyari:"",
      type: Q.SPRITE_PLAYER,
      collisionMask: Q.SPRITE_DEFAULT  | Q.SPRITE_COLLECTABLE
    });

    this.p.points = this.p.standingPoints;

    this.add('2d, platformerControls, animation, tween');

    this.on("bump.top","breakTile");

    this.on("sensor.tile","checkLadder");
    this.on("jump");
    this.on("jumped");

  },

  jump: function(obj) {
    // ses
    if (!obj.p.playedJump) {
      Q.audio.play('jump.mp3');
      obj.p.playedJump = true;

    }
  },

  jumped: function(obj) {
    obj.p.playedJump = false;
  },

  checkLadder: function(colObj) {
    if(colObj.p.ladder) { 
      this.p.onLadder = true;
      this.p.ladderX = colObj.p.x;
    }
  },

 

  resetLevel: function() {
    //Q.stageScene("level1");
    //this.p.strength = 100;
    //this.animate({opacity: 1});
    //Q.stageScene('hud', 3, this.p);
     Q.stageScene("oyunsonu",2, { label: "Malesef Oyun Bitti" });
  },

  enemyHit: function(data) {
    var col = data.col;
    var enemy = data.enemy;
    this.p.vy = -150;
    if (col.normalX == 1) {
      // soldan.
      this.p.x -=15;
      this.p.y -=15;
    }
    else {
      // sağdan;
      this.p.x +=15;
      this.p.y -=15;
    }
    this.p.immune = true;
    this.p.immuneTimer = 0;
    this.p.immuneOpacity = 1;
    this.p.strength -= 25;
    Q.stageScene('hud', 3, this.p);
    if (this.p.strength == 0) {
      this.resetLevel();
    }
  },

  continueOverSensor: function() {
    this.p.vy = 0;
    if(this.p.vx != 0) {
      this.play("walk_" + this.p.direction);
    } else {
      this.play("stand_" + this.p.direction);
    }
  },

  breakTile: function(col) {
    if(col.obj.isA("TileLayer")) {
      if(col.tile == 24) { col.obj.setTile(col.tileX,col.tileY, 36); }
      else if(col.tile == 36) { col.obj.setTile(col.tileX,col.tileY, 24); }
    }
    Q.audio.play('coin.mp3');
  },

  step: function(dt) {
    var processed = false;
    
    if(this.p.onLadder) {
      this.p.gravity = 0;
// yerçekimini sıfırla
      if(Q.inputs['up']) {
        this.p.vy = -this.p.speed;
        this.p.x = this.p.ladderX;
        this.play("climb");
      } else if(Q.inputs['down']) {
        this.p.vy = this.p.speed;
        this.p.x = this.p.ladderX;
        this.play("climb");
      } else {
        this.continueOverSensor();
      }
      processed = true;
    } 
      
    
      
    if(!processed) { 
      this.p.gravity = 1;

      if(Q.inputs['down'] && !this.p.door) {
        this.p.ignoreControls = true;
        this.play("duck_" + this.p.direction);
        if(this.p.landed > 0) {
          this.p.vx = this.p.vx * (1 - dt*2);
        }
        this.p.points = this.p.duckingPoints;
      } else {
        this.p.ignoreControls = false;
        this.p.points = this.p.standingPoints;

        if(this.p.vx > 0) {
          if(this.p.landed > 0) {
            this.play("walk_right");
          } else {
            this.play("jump_right");
          }
          this.p.direction = "right";
        } else if(this.p.vx < 0) {
          if(this.p.landed > 0) {
            this.play("walk_left");
          } else {
            this.play("jump_left");
          }
          this.p.direction = "left";
        } else {
          this.play("stand_" + this.p.direction);
        }
           
      }
    }

    this.p.onLadder = false;
    


    if(this.p.y > 1000) {
      this.stage.unfollow();
    }

    if(this.p.y > 2000) {
      this.resetLevel();
    }
  }
});
Q.scene('oyunsonu',function(stage) {
          var container = stage.insert(new Q.UI.Container({
            x: Q.width/2, y: Q.height/2, fill: "rgba(0,0,0,0.5)"
          }));
 
          var button = container.insert(new Q.UI.Button({ x: 0, y: 0, fill: "#CCCCCC",
                                                          label: "Tekrar Oyna" }))        
          var label = container.insert(new Q.UI.Text({x:0, y: -10 - button.p.h,
                                                           label: stage.options.label }));
 
          button.on("touch",function() {
            Q.clearStages();
            Q.stageScene('level1');
          });
 
          container.fit(20);
    });

Q.Sprite.extend("bezelye", {
  init: function(p) {
    this._super(p,{
      sheet: p.sprite,
      type: Q.SPRITE_COLLECTABLE,
      collisionMask: Q.SPRITE_PLAYER,
      sensor: true,
      vx: 0,
      vy: 0,
      gravity: 0
    });
    this.add("animation");

    this.on("sensor");
  },

  sensor: function(colObj) {
    if (this.p.amount) {
      colObj.p.score += this.p.amount;
if (colObj.p.speed<200) {colObj.p.speed=colObj.p.speed+20}


    }
  switch(this.p.sprite){
    case "elma": colObj.p.uyari="Elmada bol miktarda bulunan besin lifi bağışıklık sistemini güçlendirir.";break;
    case "bezelye": colObj.p.uyari="Bezelye çok etkili bir enerji kaynağı olduğundan dolayı, çocuklar için faydalıdır.";break;
    case "brokoli": colObj.p.uyari="Brokoli serbest radikallerle mücadele ederek vücudun çeşitli \n hastalıklara karşı direncini arttırır.";break;
    case "kiraz": colObj.p.uyari="Kiraz antioksidan bakımından zengin bir meyvedir.";break;
    case "domates": colObj.p.uyari="Domateste bulunan likopen kalp ve damarlar için kritik önemi bulunan antioksidan desteğini sağlar.";break;
    case "havuc": colObj.p.uyari="Havuç A vitamini kaynağıdır.";break;
    case "kahv": colObj.p.uyari="";break;
    case "kavun": colObj.p.uyari="";break;
    case "sogan": colObj.p.uyari="";break;
    case "lahana": colObj.p.uyari="Lahana sindirim kolaylığını ve bağırsakların daha sağlıklı çalışmasını sağlamaktadır.";break;
    case "limon": colObj.p.uyari="Limon çok fazla C vitamini içerir.";break;
    case "misir": colObj.p.uyari="";break;
    case "pirasa": colObj.p.uyari="Pırasa A, C, K ve B6 vitaminleri için çok iyi bir kaynaktır.";break;
    case "turp": colObj.p.uyari="Turp yüksek besin lifi içeriğiyle sindirime yardımcı olur.";break;


  }
        Q.stageScene('hud', 3, colObj.p);

    Q.audio.play('coin.mp3');
    this.destroy();
  }
});

Q.Sprite.extend("zarar", {
  init: function(p) {
    this._super(p,{
      sheet: p.sprite,
      type: Q.SPRITE_COLLECTABLE,
      collisionMask: Q.SPRITE_PLAYER,
      sensor: true,
      vx: 0,
      vy: 0,
      gravity: 0
    });
    this.add("animation");

    this.on("sensor");
  },

  sensor: function(colObj) {
    if (this.p.amount) {
      colObj.p.score -= this.p.amount;
                  colObj.p.strength = Math.max(colObj.p.strength - 10, 0);
if (colObj.p.speed>150) {colObj.p.speed=colObj.p.speed-50;
}

      if (colObj.p.strength<100) {colObj.p.renk="red"}
if (colObj.p.score<0) {colObj.p.srenk="red"}
    colObj.p.uyari="Zararlı yiyeceklerden uzak dur."

      Q.stageScene('hud', 3, colObj.p);
    }
    Q.audio.play('coin.mp3');
    this.destroy();

  }
});


Q.Sprite.extend("Collectable", {
  init: function(p) {
    this._super(p,{
      sheet: p.sprite,
      type: Q.SPRITE_COLLECTABLE,
      collisionMask: Q.SPRITE_PLAYER,
      sensor: true,
      vx: 0,
      vy: 0,
      gravity: 0
    });
    this.add("animation");

    this.on("sensor");
  },

  sensor: function(colObj) {
    // bir şey toplanırsa

    // skoru yükselt
    if (this.p.amount) {
      colObj.p.score += this.p.amount;

      Q.stageScene('hud', 3, colObj.p);
    }
    Q.audio.play('coin.mp3');
    this.destroy();
  }
});


// bu kısım değişecek

 /*Q.Sprite.extend("Deneme", {
    init: function(p) {
        this._super(p, {asset: "yiyecek.png"});
    }            
});*/

Q.scene("level1",function(stage) {
  Q.stageTMX("level1.tmx",stage);


  stage.add("viewport").follow(Q("Player").first());
});

Q.scene('hud',function(stage) {
  var container = stage.insert(new Q.UI.Container({
    x: 50, y: 0
  }));
  //en boy oranı

  var label = container.insert(new Q.UI.Text({x:200, y: 20,
    label: "Puan: " + stage.options.score, color: stage.options.srenk }));

  var strength = container.insert(new Q.UI.Text({x:50, y: 20,
    label: "Sağlık: " + stage.options.strength + '%', color: stage.options.renk }));
var uyari = container.insert(new Q.UI.Text({x:Q.width/2, y: 200,
    label: stage.options.uyari , color: "blue" , align: 'center',
}));
  container.fit(20);
});

          
            
Q.loadTMX("level1.tmx, collectables.json, fire.mp3, jump.mp3, heart.mp3, hit.mp3, coin.mp3, player.json, player.png , yiyecek.json , zarar1.json", function() {
    
    Q.compileSheets("player.png","player.json");
    Q.compileSheets("collectables.png","collectables.json");
    Q.compileSheets("yiyecek.png","yiyecek.json");
    Q.compileSheets("zarar1.png","zarar1.json");

    Q.animations("player", {
      walk_right: { frames: [0,1,2,3,4,5,6,7,8,9,10], rate: 1/15, flip: false, loop: true },
      walk_left: { frames:  [0,1,2,3,4,5,6,7,8,9,10], rate: 1/15, flip:"x", loop: true },
      jump_right: { frames: [13], rate: 1/10, flip: false },
      jump_left: { frames:  [13], rate: 1/10, flip: "x" },
      stand_right: { frames:[14], rate: 1/10, flip: false },
      stand_left: { frames: [14], rate: 1/10, flip:"x" },
      duck_right: { frames: [15], rate: 1/10, flip: false },
      duck_left: { frames:  [15], rate: 1/10, flip: "x" },
      climb: { frames:  [16, 17], rate: 1/3, flip: false }
    });
 

    Q.stageScene("level1");
    Q.stageScene('hud', 3, Q('Player').first().p);
  
}, {
  progressCallback: function(loaded,total) {
    var element = document.getElementById("loading_progress");
    element.style.width = Math.floor(loaded/total*100) + "%";
    if (loaded == total) {
      document.getElementById("loading").remove();
    }
  }
});


});
