const form = document.querySelector('form');
const name = document.querySelector('#name');
const cost = document.querySelector('#cost');
const error = document.querySelector('#error-msg');

form.addEventListener("submit", e => {
  e.preventDefault();

  //check if user entered both values
  if(name.value && cost.value) {
    const item = {
      name: name.value,
      cost: parseInt(cost.value) 
    }

    db.collection("expenses").add(item).then(res => {
      name.value = "";
      cost.value = "";
      error.textContent = "";
    })

  } else {
    error.textContent = "Please enter values";
  }
})

