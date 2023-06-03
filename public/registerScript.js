function register() {
  email = document.getElementById("email").value
  password = document.getElementById("password").value
  fetch('/register', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: {
      'email': email,
      'password': password
    }
  }).then((res) => res.json().then((response) => {
    if(response.status == "Success") {
      sessionStorage.setItem("sessionID", response.sessionID)
      document.location = "/"
    }
  }))

}
