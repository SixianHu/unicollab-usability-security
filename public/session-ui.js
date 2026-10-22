// Keep server logout aligned with the original browser-local identity cleanup.
document.addEventListener('click',async event=>{
 const button=event.target.closest('#dashLogoutBtn, #wsLogoutBtn, #gppLogoutBtn');if(!button)return;
 event.preventDefault();event.stopImmediatePropagation();
 await fetch('/logout',{method:'POST'});
 for(const key of ['unicollab_studentId','unicollab_fullName','unicollab_email'])localStorage.removeItem(key);
 window.location.href='./login.html';
},true);
