function register() {
  email = document.getElementById("email").value.toLowerCase()
  password = document.getElementById("password").value
  creds = [email,password]
  fetch('/register', {
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
    }
  }))

}
