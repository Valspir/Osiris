function login() {
  email = document.getElementById("email").value.toLowerCase()
  password = document.getElementById("password").value
  creds = [email,password]
  fetch('/login', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(creds)
  }).then((res) => res.json().then((response) => {
  if(response.status == "Success") {
    sessionStorage.setItem("sessionID", response.sessionID)
    document.location = "/"
  }else{
    console.log(creds)
    console.log(response)
  }
}))
  //})
}

function sha512(str) {
  /*return crypto.subtle.digest("SHA-512", new TextEncoder("utf-8").encode(str)).then(buf => {
    return Array.prototype.map.call(new Uint8Array(buf), x=>(('00'+x.toString(16)).slice(-2))).join('');
  });*/
  return str
}
