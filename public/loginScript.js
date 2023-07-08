function login() {
  email = document.getElementById("loginEmail").value.toLowerCase()
  password = document.getElementById("loginPassword").value
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
      console.log(response)
    }
  }))
}
