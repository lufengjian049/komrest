$(function(){
	//cover
	var coverCanvas=$("#coverCanvas"),coverCtx=coverCanvas[0].getContext("2d"),
	coverX=coverCanvas.width()/2,coverY=coverCanvas.height()/2,firstR=40,secR=35,startan=Math.PI*5/6;
	Util.drawarc(coverCanvas,coverCtx,{x: coverX,y:coverY ,radius:firstR,startAngle:startan,endAngle:startan+Math.PI,color:'#0380ba'});
	//coverCtx.globalCompositeOperation="destination-out";
	Util.drawarc(coverCanvas,coverCtx,{x: coverX-Math.cos(Math.PI/6)*(firstR-secR),y:coverY+Math.sin(Math.PI/6)*(firstR-secR),radius:secR,startAngle:startan,endAngle:startan+Math.PI,color:'#fff'});
	Util.drawarc(coverCanvas,coverCtx,{x: coverX-Math.cos(Math.PI/6)*(firstR-secR),y:coverY+Math.sin(Math.PI/6)*(firstR-secR),radius:8,color:"#6c6c6c"});
	
})