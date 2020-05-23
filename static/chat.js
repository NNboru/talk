
dlg.showModal();
let vh = window.innerHeight;
document.documentElement.style.setProperty('--vh', `${vh}px`);
let sound = new Audio('../static/bulb.ogg'), sallow=1;
let cnt = 0, realflag=0;
let bstate = 1, blinkpos=typer.firstElementChild;

/*
let isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
if (!isMobile) {
	divkeyswap.remove();
}
*/

//=socket
socket = io();

socket.emit('getprooms', prooms=>{
	for(let i in prooms){
		publicdiv.insertAdjacentHTML('beforeEnd',`<button>${i}</button>`);
	}
	if(publicdiv.childElementCount==0)
		publicdiv.remove();
});

socket.on('connect', function(){
	if(typeof u=='undefined') return;
	socket.emit('aminew', u, r, p, (code, scnt, ulist)=>{
		notify('Connected');
		if(code==0){
			if(scnt!=cnt){
				//notifyError((scnt-cnt) + ' messages lost!! (bad connection)');
				socket.emit('getallmsg', r, cnt, (allmsg, scnt)=>{
					allmsg.reverse();
					if(sallow) sound.play();
					msgbox.insertAdjacentHTML( 'afterBegin', unescape(allmsg.join('')) );
					cnt=scnt;
				});
			}
			users=ulist;
			userlist.innerHTML='';
			for(let i in ulist){
				userlist.insertAdjacentHTML('afterBegin', `<div value=${i}>${i}</div>`);
			}
		}
		else{
			notifyError('Sorry, This room is destroyed!<br><a href=/>Reload</a> and join again');
			socket.close();
		}
	});
});

socket.on('disconnect', function(){
	notifyError('Connection lost');
});

socket.on('msgbot', function(msg){
	cnt++;
	msgbox.insertAdjacentHTML('afterBegin',msg);
});

socket.on('msg', function(msg, servercnt){
	cnt++;
	if(servercnt!=cnt){
		notifyError((servercnt-cnt) + ' messages lost!! (network error)');
		cnt=servercnt;
	}
	if(sallow) sound.play();
	msgbox.insertAdjacentHTML('afterBegin', unescape(msg));
});

socket.on('newuser', u=>{
	notify(u + ' joined');
	userlist.insertAdjacentHTML('afterBegin', `<div value=${u}>${u}</div>`);
});

socket.on('backuser', u=>{
	notify(u + ' returned');
	userlist.insertAdjacentHTML('afterBegin', `<div value=${u}>${u}</div>`);
});

socket.on('byeuser', u=>{
	notify(u + ' left');
	let elem = userlist.querySelector(`[value=${u}]`);
	if(elem)
		elem.remove();
});

async function dologin(){
	let m=/[\w@ -]/;
	for(let i of room.value){
		if(!m.test(i)){
			room.setCustomValidity(`char "${i}" not allowed`);
			return;
		}
	}
	u = user.value;
	r = room.value;
	p = pass.value;
	socket.emit('joinroom', u, r, p, (code, msg, ulist, servercnt)=>{
		if(code){
			error.innerHTML=msg;
			return;
		}
		username.innerHTML=u;
		roomname.innerHTML=r;
		dlg.close();
		bdy.onkeydown=insertletter;
		users=ulist;
		for(let i in ulist){
			userlist.insertAdjacentHTML('afterBegin', `<div value=${i}>${i}</div>`);
		}
		if(servercnt!=0){
			notify(`you missed ${servercnt} messages`);
			cnt=servercnt;
		}
	})
	
}

//=socket-end


//=event functions
	//=body
//socket.close();
//bdy.onkeydown=insertletter;
bdy.onerror=function(e){alert(e);}
function insertletter(e){
	//console.dir(e);
	if([32, 13, 9].includes(e.keyCode))
		if(e.preventDefault)
			e.preventDefault();
	if(mykey.checked) return;
	blinkpos.innerHTML='';
	if(e.ctrlKey){
		if(e.key.toLowerCase()=='v'){
			pastebut.click();
		}
		else if(e.keyCode==13){
			sendbut1.click();
		}
	}
	else if(e.keyCode==9){
		blinkpos.insertAdjacentHTML('beforeBegin',"<div class='blinker'></div><pre class='letter'>	</pre>");
	}
	else if(e.keyCode==13){
		blinkpos.insertAdjacentHTML('beforeBegin',`<div class='blinker'></div><br>`);
		blinkpos.scrollIntoViewIfNeeded();
	}else if(e.keyCode==35){
		blinkpos = typer.lastElementChild;
	}
	else if(e.keyCode==36){
		blinkpos = typer.firstElementChild;
	}
	else if(e.keyCode==37){
		if(blinkpos.previousElementSibling){
			blinkpos = blinkpos.previousElementSibling.previousElementSibling;
		}
	}
	else if(e.keyCode==39){
		if(blinkpos.nextElementSibling){
			blinkpos = blinkpos.nextElementSibling.nextElementSibling;
		}
	}
	else if(e.keyCode==8){
		if(blinkpos.previousElementSibling){
			blinkpos.previousElementSibling.remove();
			blinkpos.previousElementSibling.remove();
		}
	}
	else if(e.keyCode==32){
		addL(e.key);
	}
	else if(e.key.length==1)
		addL(e.key);
	blinkpos.innerHTML='‍';
	
}

window.addEventListener('resize', () => {
  let vh = window.innerHeight;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
});

	//=dlg
user.onchange=()=>{error.innerHTML=''}
room.onchange=()=>{user.setCustomValidity('')}
login.onsubmit=()=>{dologin().catch((e)=>alert(e));return false;};
publicdiv.onclick=e=>{
	let but = e.target;
	if(but.tagName=='BUTTON'){
		room.value=but.innerHTML;
	}
}

	//=dlgmenu
closeit.onclick=()=>{
	dlgmenu.close();
}
bye.onclick=()=>{
	myalert('Thanks for being here 🤗<br>bye-bye 👋🏻');
	socket.emit('byebye',u, r, (ret)=>{
		socket.close();
		location = '/';
	});
}
mykey.onchange=()=>{
	mykey.blur();
	if(mykey.checked){
		real.id='temp';
		typer.id='real';
		temp.id='typer';
		hideme1.click();
		showme.hidden=true;
		pastebut.hidden=true;
		bdy.onkeydown=null;
	}
	else{
		real.id='temp';
		typer.id='real';
		temp.id='typer';
		showme.hidden=false;
		pastebut.hidden=false;
		bdy.onkeydown=insertletter;
	}
}
mysnd.onchange=()=>{
	sallow = !sallow;
}
getmsgbut.onclick = ()=>{
	if(confirm('Confirm reload..\nYou will lose all notifications (if any)')){
		socket.emit('getallmsg', r, (allmsg, scnt)=>{
			allmsg.reverse();
			msgbox.innerHTML=unescape(allmsg.join(''));
			cnt=scnt;
		});
		dlgmenu.close();
	}
}

	//=dlgpop
dlgpop.onclick=()=>{
	dlgpop.close();
}

	//=header
clearbut.onclick=(e)=>{
	if(mykey.checked)
		typer.innerHTML='';
	else{
		typer.innerHTML="<div class='blinker'></div>";
		blinkpos = typer.firstElementChild;
	}
}
wrapbut.onclick=()=>{
	if(wrapbut.classList.contains('pressed')){
		wrapbut.classList.remove('pressed');
		typer.style.whiteSpace='initial';
	}
	else{
		wrapbut.classList.add('pressed');
		typer.style.whiteSpace='nowrap';
	}
}
pastebut.onclick=e=>{
	navigator.clipboard.readText().then(v=>{
		if(!v) return;
		if(mykey.checked)
			insertTyper(document.createTextNode(v));
		else{
			for(let i of v) insertletter({key:i});
		}
	}).catch(e=>myalert('Paste not allowed'));
}
imagebut.onclick=()=>{
	image.click();
}
image.onchange=async function(){
	for(let i=0;i<image.files.length;i++){
		let temp = document.createElement('img');
		if(await saveImage(temp, image.files[i])) return;
		if(mykey.checked)
			insertTyper(temp);
		else{
			blinkpos.insertAdjacentHTML('beforeBegin',`<div class='blinker'></div>`);
			blinkpos.before(temp);
			blinkpos.innerHTML='‍';
		}
	}
}
async function saveImage(elem, f){
	if(f){
		let form = new FormData();
		form.append('file',f);
		//loadbox.style.display='grid';
		let resp = await fetch('/saveChatImage',{method:'POST',body:form });
		if(resp.ok){
			let data = await resp.json();
			if(data['code']!=0){
				alert('Image not Saved - Error occurred on server: '+data['msg']);
				return 1;
			}
			else{
				elem.src=data['msg'];
			}
		}
		else{
			alert('some error occured while saving image.');
			return;
		}
		//loadbox.style.display='none';
	}
}
options.onclick=()=>{
	if(dlgmenu.open)
		dlgmenu.close();
	else
		dlgmenu.showModal();
}

	//=typebox
		//=typer
typer.onclick=(e)=>{
	//console.dir(e);
	if(mykey.checked) return;
	let but = e.target;
	blinkpos.innerHTML='';
	if(but==typer){
		if(e.offsetY>8 && e.offsetY<but.offsetHeight-10){
			if(e.offsetX<20)
				blinkpos = typer.firstElementChild;
			else
				blinkpos = typer.lastElementChild;
		}
	}
	else if(but.classList.contains('blinker'))
		blinkpos = but;
	else{
		if(e.offsetX<but.offsetWidth/2)
			blinkpos = but.previousElementSibling;
		else
			blinkpos = but.nextElementSibling;
	}
	blinkpos.innerHTML='‍';
}
real.onkeydown=e=>{
	if(e.ctrlKey){
		if(e.keyCode==13){
			sendbut1.click();
		}
	}
	if(e.keyCode==9){
		e.preventDefault();
		let p = document.createElement('pre');
		p.innerHTML='	';
		insertTyper(p);
	}
}
		//=sendbut's
sendbut1.onclick=sending;
sendbut2.onclick=sending;
sendbut3.onclick=sending;
function sending(e){
	e.stopPropagation();
	blinkpos.innerHTML='';
	txt = typer.innerHTML;
	clearbut.click();
	if( txt.trim().length>27 || (mykey.checked && txt.trim().length>0) ){
		let d = document.createElement('div'),d2 = d.cloneNode(), bar = d.cloneNode();
		d.innerHTML = txt;
		d.style.whiteSpace=typer.style.whiteSpace;
		d.classList.add('msg');
		bar.innerHTML=`<span>${u}</span> <span>⏲</span>`;
		bar.classList.add('bar');
		d2.appendChild(bar);
		d2.appendChild(d);
		
		socket.emit('msg', escape(d2.outerHTML), u, r, (t,servercnt)=>{
			bar.lastElementChild.innerHTML='&nbsp;'+t+'&emsp;✔';
			cnt++;
			if(servercnt!=cnt){
				notifyError((servercnt-cnt) + ' messages lost!! (network error)');
				cnt=servercnt;
			}
		});
		d.classList.add('me');
		msgbox.prepend(d2);
	}
	else
		myalert('<span class=smaller>nothing to send</span>');
	blinkpos.innerHTML='‍';
	e.target.blur();
}

		//=msgbox
msgbox.onclick=e=>{
	let elem = e.target;
	if(elem.tagName=='IMG'){
		openFullscreen(elem);
	}
}


	//=board
keys.onclick=e=>{
	let but = e.target;
	if(but.id=='smily'){
		keys.style.display='none';
		smilediv.style.display='grid';
		return;
	}
	addL(but.innerHTML);
	setTimeout(()=>{but.blur()},1000);
}
smilediv.onclick=e=>{
	let but = e.target;
	if(but.id=='textbut'){
		keys.style.display='grid';
		smilediv.style.display='none';
		return;
	}
	addL(but.innerText);
}

inpsm.onfocus=()=>{bdy.onkeydown=null;}
inpsm.onkeypress=e=>{if(e.key=='Enter')e.target.blur()}

inpsm.onblur=e=>{
	bdy.onkeydown=insertletter;
	for(let i of inpsm.value){
		if(i==' ')
			continue;
		smilebox.insertAdjacentHTML('afterBegin',`<button>${i}</button>`);
		if(smilebox.childElementCount>30)
			smilebox.lastElementChild.previousElementSibling.remove();
	}
	inpsm.value='';
}

showme.onclick=e=>{
	board.hidden=false;
	showme.hidden=true;
	main.style.gridTemplateRows='40px auto 300px';
}

hideme1.onclick=e=>{
	e.stopPropagation();
	board.hidden=true;
	showme.hidden=false;
	main.style.gridTemplateRows='40px auto 0px';
}
hideme2.onclick=e=>{
	e.stopPropagation();
	board.hidden=true;
	showme.hidden=false;
	main.style.gridTemplateRows='40px auto 0px';
}
goleftbut.onclick=e=>{
	e.stopPropagation();
	insertletter({keyCode:37});
}
gorightbut.onclick=e=>{
	e.stopPropagation();
	insertletter({keyCode:39});
}
delbut2.onclick=delbut.onclick=e=>{
	e.stopPropagation();
	insertletter({keyCode:8});
}
upbut.onclick=e=>{
	e.stopPropagation();
	if(upbut.classList.contains('pressed')){
		upbut.classList.remove('pressed');
		for(let b of keys.querySelectorAll('button:not([id])'))
			b.innerHTML = b.innerHTML.toLowerCase();
	}
	else{
		upbut.classList.add('pressed');
		for(let b of keys.querySelectorAll('button:not([id])'))
			b.innerHTML = b.innerHTML.toUpperCase();
	}
}
enterbut.onclick=e=>{
	e.stopPropagation();
	insertletter({keyCode:13});
}


//=non event functions
setInterval(blinking, 2000);
function blinking(){
	let but = blinkpos;
	but.innerHTML='‍';
	setTimeout(()=>{but.innerHTML=''},1000);
}

function addL(letter){
	if(letter.length>2)return;
	blinkpos.insertAdjacentHTML('beforeBegin',`<div class='blinker'></div><pre class='letter'>${letter}</pre>`);
}

function insertTyper(elem){
	let txt=window.getSelection().getRangeAt(0);
	if(!typer.contains(txt.commonAncestorContainer)){
		txt = new Range();
		txt.selectNodeContents(typer);
	}
	else
		txt.deleteContents();
	txt.insertNode(elem);
	txt.collapse();
}

function notify(msg){
	msgbox.insertAdjacentHTML('afterBegin', `<div class=notify>${msg}</div>`);
}
function notifyError(msg){
	msgbox.insertAdjacentHTML('afterBegin', `<div class='notify error'>${msg}</div>`);
}

function myalert(txt){
	//setTimeout(()=>{sendbut1.innerHTML='send'},2000);
	//sendbut1.innerHTML=txt;
	dlgpop.innerHTML=txt;
	dlgpop.classList.add('anipop');
	dlgpop.show();
}
dlgpop.onanimationend=e=>{dlgpop.close();dlgpop.classList.remove('anipop');}
function openFullscreen(elem) {
  if (elem.requestFullscreen) {
	elem.requestFullscreen();
  } else if (elem.mozRequestFullScreen) { /* Firefox */
	elem.mozRequestFullScreen();
  } else if (elem.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
	elem.webkitRequestFullscreen();
  } else if (elem.msRequestFullscreen) { /* IE/Edge */
	elem.msRequestFullscreen();
  }
}
function closeFullscreen() {
	if(!document.fullscreen) return;
	if (document.exitFullscreen)
		document.exitFullscreen();
	else if (document.mozCancelFullScreen)
		document.mozCancelFullScreen();
	else if (document.webkitExitFullscreen)
		document.webkitExitFullscreen();
	else if (document.msExitFullscreen)
		document.msExitFullscreen();
}

if(!navigator.clipboard){
	pastebut.remove();
	pastebut = document.createElement('button');
}
/*
Virtual keyboard is used on default.
blinker & letter div are added in typer so that default keyboard is not opened in mobile.

images and text can be send together.
you can also send other files(by selecting all files on file popup),
	and open it by right click and select 'open in new tab'(not possible in mobile).


//future
there is no db till now, but images are saved on server.
any messages lost by any user cannot be seen again.(coz there is no db)

when user leaves or reloads, logout takes some time so user cannot enter quickly.


*/

/*
var timer;
var istrue = false;
var delay = 800;
function addL(letter){
	if(letter.length>2)return;
	blinkpos.insertAdjacentHTML('beforeBegin',`<div class='blinker'></div><pre class='letter'>${letter}</pre>`);
	pressLong(letter);
}
function pressLong(letter){
	istrue = true;
	timer = setTimeout(makeChange,delay,letter);
}
function makeChange(letter)
{
	clearTimeout(timer);
	flooding(letter);
}
function flooding(letter){
	if(istrue){
		if(typeof letter=='string')
			blinkpos.insertAdjacentHTML('beforeBegin',`<div class='blinker'></div><pre class='letter'>${letter}</pre>`);
		else
			insertletter(letter);
		setTimeout(flooding,50,letter);
	}
}
function revert()
{
   istrue = false;
   clearTimeout(timer);
}

*/



