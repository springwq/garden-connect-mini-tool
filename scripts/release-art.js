/* Publish artwork rendered from the game's own original Canvas art and sprites. */
(function () {
  'use strict';
  function rounded(c,x,y,w,h,r,color){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();c.fillStyle=color;c.fill();}
  function text(c,value,x,y,size,color){c.font='900 '+size+'px -apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif';c.textAlign='center';c.fillStyle=color;c.fillText(value,x,y);}
  window.FengwuArt.ready.then(function(){
    var icon=document.getElementById('release-icon'),i=icon.getContext('2d');
    i.fillStyle='#a8dfe4';i.fillRect(0,0,512,512);
    rounded(i,28,28,456,456,92,'#fff6d8');rounded(i,45,45,422,422,80,'#ffcf75');
    rounded(i,73,91,166,208,38,'#d49c4f');rounded(i,73,79,166,208,38,'#fffbea');
    rounded(i,273,211,166,208,38,'#d49c4f');rounded(i,273,199,166,208,38,'#fffbea');
    window.FengwuArt.stamp(i,6,156,180,72);window.FengwuArt.stamp(i,6,356,300,72);
    i.beginPath();i.moveTo(156,321);i.lineTo(156,365);i.lineTo(241,365);i.lineWidth=15;i.strokeStyle='#fffdf1';i.lineCap='round';i.lineJoin='round';i.stroke();
    i.beginPath();i.moveTo(269,147);i.lineTo(356,147);i.lineTo(356,177);i.stroke();
    var cover=document.getElementById('release-cover'),c=cover.getContext('2d');
    c.fillStyle='#b4e8ef';c.fillRect(0,0,1080,1440);
    var scene=document.createElement('canvas');scene.width=720;scene.height=560;window.FengwuArt.cover(scene.getContext('2d'),0);
    c.drawImage(scene,0,235,1080,840);
    text(c,'开心连连看',540,170,112,'#317b89');text(c,'连一连，收集开心卡',540,250,39,'#3c8389');
    rounded(c,100,760,880,560,55,'#559a98');rounded(c,100,746,880,560,55,'#fffce5');
    var kinds=[6,6,0,2,7,9,8,3,8,3,7,9];
    kinds.forEach(function(k,n){var x=145+(n%4)*202,y=790+Math.floor(n/4)*162;rounded(c,x,y,182,144,28,'#f4e8bf');window.FengwuArt.stamp(c,k,x+91,y+68,63);});
    c.strokeStyle='#f19a52';c.lineWidth=9;c.lineCap='round';c.beginPath();c.moveTo(236,950);c.lineTo(438,950);c.stroke();
    rounded(c,275,1257,530,95,45,'#f17855');text(c,'通关就送 · 星级收藏卡',540,1318,32,'#fffbea');
    text(c,'三档难度 · 不限时 · 轻松玩',540,1400,29,'#4f8372');
    [icon,cover].forEach(function(canvas){var a=document.createElement('a');a.href=canvas.toDataURL('image/png');a.download=canvas===icon?'icon.png':'cover.png';a.id=canvas===icon?'export-icon':'export-cover';a.textContent=canvas===icon?'下载图标':'下载封面';document.body.appendChild(a);});
    document.getElementById('status').textContent='发布素材已生成';
  }).catch(function(){document.getElementById('status').textContent='素材加载失败';});
})();
