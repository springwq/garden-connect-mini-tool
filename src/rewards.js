/* Original collectible rewards. A round's id fixes its illustration across reloads. */
(function () {
  'use strict';
  var tiers = [
    {name:'元气',min:0,color:'#4a9b80',light:'#d8f4da',dark:'#24644f'},
    {name:'闪亮',min:700,color:'#419bc2',light:'#d3f3ff',dark:'#236482'},
    {name:'珍藏',min:2400,color:'#a47cc9',light:'#eee0ff',dark:'#725094'},
    {name:'梦幻',min:4300,color:'#d5739a',light:'#ffe0ec',dark:'#a24370'},
    {name:'典藏',min:4800,color:'#d5a13e',light:'#fff0b3',dark:'#91621c'}
  ];
  var titles=['早安咖啡','闪光时刻','花开好心情','可颂小憩','轻装出发','樱桃心愿',
    '草莓甜心','冰淇淋假期','柠檬晴天','惊喜礼物','风里的快乐','小熊抱抱'];
  var wishes=['把今天过得热气腾腾','值得收藏的一瞬间','送自己一朵好心情','歇一会儿也很棒','轻轻松松去出发','小小心愿慢慢实现',
    '今天的快乐是草莓味','给闲暇加一点甜','装一口袋好天气','下一份惊喜在路上','让快乐转起来','给努力的你一个拥抱'];
  function tier(score) { var n=0;tiers.forEach(function(t,i){if(score>=t.min)n=i;});return n; }
  function create(state) {
    var hash=0;for(var i=0;i<state.id.length;i++)hash=(hash*31+state.id.charCodeAt(i))>>>0;
    var kind=hash%titles.length;
    return {type:'reward',id:state.id,score:state.score,level:state.level,kind:kind,date:state.date,message:wishes[kind]};
  }
  function valid(r) {
    if(!r||r.type!=='reward'||typeof r.id!=='string'||r.id.length>100||!Number.isInteger(r.kind)||r.kind<0||r.kind>=12||
      !Number.isInteger(r.level)||r.level<0||r.level>2||!Number.isInteger(r.score)||r.score%10!==0||
      typeof r.date!=='string'||!/^\d{4}\.\d{2}\.\d{2}$/.test(r.date)||r.message!==wishes[r.kind])return false;
    return r.score >= [500,2000,3900][r.level] && r.score <= [750,2750,4950][r.level];
  }
  window.GameRewards={tiers:tiers,tier:tier,titles:titles,create:create,valid:valid};
})();
