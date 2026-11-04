/* Original toy-town art. Generation provenance: docs/art-v6.md. */
(function () {
  "use strict";
  var image = new Image(), extras = new Image(), world = new Image();
  // Bounds are in the source atlas' 1280 × 1280 coordinate space.
  var regions = [[0,120,425,430],[430,155,405,395],[840,80,440,510],[0,755,425,380],[430,675,390,480],[830,715,435,435]];
  var extraRegions = [[20,95,400,470],[445,70,355,530],[845,100,390,460],[10,690,410,480],[440,680,370,500],[830,680,405,500]];
  var titles = ["快乐出发", "甜甜补给", "花开好心情"];
  var colors = ["#c7eef4", "#ffe6bc", "#eddcf5"];
  function load(img, path) { return new Promise(function (resolve, reject) { img.onload=resolve;img.onerror=function(){reject(new Error('art load failed'));};img.src=path; }); }
  var ready = Promise.all([load(image,'./assets/toys-v6.webp'),load(world,'./assets/world-v6.jpg'),load(extras,'./assets/toys-v7-extra.webp')]);
  function stamp(c,k,x,y,radius) {
    var source=image, p=regions[k];
    if(k>=6 && k<12){source=extras;p=extraRegions[k-6];}
    if(!p)return;
    var scale=Math.min(radius*2/p[2],radius*2/p[3]);
    c.drawImage(source,p[0]*source.naturalWidth/1280,p[1]*source.naturalHeight/1280,p[2]*source.naturalWidth/1280,p[3]*source.naturalHeight/1280,x-p[2]*scale/2,y-p[3]*scale/2,p[2]*scale,p[3]*scale);
  }
  function round(c,x,y,w,h,r,fill) {
    c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();c.fillStyle=fill;c.fill();
  }
  function text(c,value,x,y,size,color,align) {
    c.fillStyle=color;c.font='800 '+size+'px -apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif';c.textAlign=align||'center';c.fillText(value,x,y);
  }
  function cloud(c,x,y,s) {
    c.save();c.translate(x,y);c.scale(s,s);c.fillStyle='#fffdf0';
    c.beginPath();c.arc(-32,0,24,0,Math.PI*2);c.arc(0,-15,35,0,Math.PI*2);c.arc(33,0,24,0,Math.PI*2);c.fill();c.restore();
  }
  function pedestal(c,k,x,y,r,angle) {
    c.save();c.translate(x,y);c.rotate(angle||0);
    c.fillStyle='rgba(47,112,85,.18)';c.beginPath();c.ellipse(0,r*.65,r*.82,r*.19,0,0,Math.PI*2);c.fill();
    stamp(c,k,0,0,r);c.restore();
  }
  function cover(c,theme) {
    c.clearRect(0,0,720,560);c.save();
    // Full diorama blends into the sky and grass instead of a framed web banner.
    c.drawImage(world,0,0,world.naturalWidth,world.naturalHeight,0,0,720,480);
    var fade=c.createLinearGradient(0,0,0,90);fade.addColorStop(0,'#bfecef');fade.addColorStop(1,'rgba(191,236,239,0)');c.fillStyle=fade;c.fillRect(0,0,720,90);
    var bottom=c.createLinearGradient(0,390,0,560);bottom.addColorStop(0,'rgba(206,237,183,0)');bottom.addColorStop(.65,'#ceebb9');bottom.addColorStop(1,'#ceeab5');c.fillStyle=bottom;c.fillRect(0,390,720,170);
    var sets=[[1,11,10],[3,7,6],[8,2,9]], a=sets[theme];
    pedestal(c,a[0],172,408,78,-.14);pedestal(c,a[2],555,420,71,.16);pedestal(c,a[1],365,390,118,-.04);
    c.restore();
  }
  function page(c,r,paper,ink) {
    var theme=r.paper;c.save();c.clearRect(0,0,1080,1440);c.fillStyle=colors[theme];c.fillRect(0,0,1080,1440);
    cloud(c,130,165,1.5);cloud(c,920,310,1.8);
    c.fillStyle=theme===1?'#e7c08c':theme===2?'#c7b7e0':'#9bcfa5';c.beginPath();c.ellipse(550,1150,790,430,0,0,Math.PI*2);c.fill();
    round(c,48,40,984,1360,60,'rgba(255,255,242,.48)');
    text(c,'开心小镇 · 快乐收藏',540,115,25,'#558c8c');
    c.lineWidth=12;c.strokeStyle='#fffbdd';c.font='900 76px -apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif';c.textAlign='center';c.strokeText(titles[theme],540,223);c.fillStyle=ink;c.fillText(titles[theme],540,223);
    var poses=[[[280,470,-.12,165],[780,480,.12,165],[540,760,-.04,205],[280,1030,.1,165],[820,1040,-.1,165]],[[540,510,-.05,225],[245,790,-.13,155],[830,780,.1,155],[350,1040,.1,155],[755,1050,-.1,155]],[[550,480,.04,220],[250,750,-.13,160],[825,775,.13,160],[310,1040,.07,160],[760,1060,-.09,160]]][theme];
    r.slots.forEach(function(k,i){var p=poses[i];c.save();c.translate(p[0],p[1]);c.rotate(p[2]);round(c,-p[3],-p[3],p[3]*2,p[3]*2,40,'rgba(255,255,237,.7)');c.fillStyle='rgba(70,115,75,.13)';c.beginPath();c.ellipse(0,p[3]*.68,p[3]*.68,p[3]*.14,0,0,Math.PI*2);c.fill();if(k===null){c.strokeStyle='#89b2a2';c.lineWidth=7;c.setLineDash([12,14]);c.strokeRect(-p[3]*.68,-p[3]*.68,p[3]*1.36,p[3]*1.36);c.setLineDash([]);text(c,'＋',0,20,70,'#89b2a2');}else stamp(c,k,0,-8,p[3]*.92);c.restore();});
    round(c,100,1230,880,100,35,'#fffbe0');c.font='600 32px -apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif';c.fillStyle=ink;c.textAlign='center';c.fillText(r.message||'今天也收获了开心',540,1292,820);
    text(c,r.date+'   ·   开心连连看',540,1374,22,'#638d7c');c.restore();
  }
  function star(c,x,y,r,color) {
    c.beginPath();
    for(var i=0;i<10;i++){var a=-Math.PI/2+i*Math.PI/5, d=i%2?r*.46:r;
      if(i)c.lineTo(x+Math.cos(a)*d,y+Math.sin(a)*d);else c.moveTo(x+Math.cos(a)*d,y+Math.sin(a)*d);}
    c.closePath();c.fillStyle=color;c.fill();
  }
  function reward(c,r) {
    var rewards=window.GameRewards,rank=rewards.tier(r.score),t=rewards.tiers[rank];
    c.save();c.clearRect(0,0,1080,1440);
    var gradient=c.createLinearGradient(0,0,1080,1440);
    gradient.addColorStop(0,t.light);gradient.addColorStop(.55,'#fffbed');gradient.addColorStop(1,t.color);
    c.fillStyle=gradient;c.fillRect(0,0,1080,1440);
    round(c,30,30,1020,1380,70,t.color);round(c,48,48,984,1344,56,'#fffbea');
    round(c,66,66,948,1308,46,t.light);
    // Quiet rays and small confetti keep the toy illustration in the foreground.
    c.save();c.beginPath();c.rect(66,66,948,1308);c.clip();
    c.translate(540,650);c.fillStyle='rgba(255,255,255,.3)';
    for(var i=0;i<12;i++){c.rotate(Math.PI/6);c.beginPath();c.moveTo(0,0);c.lineTo(-85,-950);c.lineTo(85,-950);c.closePath();c.fill();}c.restore();
    round(c,340,105,400,78,39,t.color);text(c,t.name+'收藏卡',540,157,34,'#ffffff');
    text(c,rewards.titles[r.kind],540,283,70,t.dark);
    for(var n=0;n<5;n++)star(c,380+n*80,352,26,n<=rank?t.color:'rgba(255,255,255,.85)');
    c.fillStyle='rgba(255,255,255,.7)';c.beginPath();c.arc(540,690,295,0,Math.PI*2);c.fill();
    c.fillStyle='rgba(50,70,50,.09)';c.beginPath();c.ellipse(540,927,205,28,0,0,Math.PI*2);c.fill();
    stamp(c,r.kind,540,683,255);
    [[170,470,18],[897,500,23],[180,870,25],[915,915,17]].forEach(function(p){star(c,p[0],p[1],p[2],t.color);});
    if(rank>=3){star(c,250,390,12,'#fff');star(c,850,1040,20,'#fff');}
    round(c,175,1030,730,180,42,'#fffbed');
    text(c,String(r.score),540,1131,80,t.dark);text(c,'通关得分',540,1177,25,t.color);
    text(c,r.message,540,1285,33,t.dark);
    text(c,r.date+'   ·   开心连连看',540,1354,22,t.dark);
    c.restore();
  }
  window.FengwuArt={ready:ready,stamp:stamp,cover:cover,page:page,reward:reward};
})();
