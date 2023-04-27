/* eslint-disable */
import { logOut } from './login';
import { updatePassword, updateNameEmail } from './updateSettings';
//DOM ELEMENTS
const loginForm = document.querySelector('.form--login');
const updateForm = document.querySelector('.form-user-data');
const logOutBtn = document.querySelector('.nav__el--logout');
const updatePassForm = document.querySelector('.form-user-settings');

if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    console.log(1);

    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });
}

if (logOutBtn) {
  logOutBtn.addEventListener('click', (e) => {
    logOut();
  });
}

if (updateForm) {
  updateForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append('name', updateForm.name.value);
    form.append('email', updateForm.email.value);
    form.append('photo', updateForm.photo.files[0]);
    updateNameEmail(form);
  });
}
if (updatePassForm) {
  updatePassForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const currpass = document.querySelector('#password-current').value;
    const pass = document.querySelector('#password').value;
    const passconfirm = document.querySelector('#password-confirm').value;
    await updatePassword(currpass, pass, passconfirm);
    document.querySelector('#password-current').value = '';
    document.querySelector('#password').value = '';
    document.querySelector('#password-confirm').value = '';
  });
}
