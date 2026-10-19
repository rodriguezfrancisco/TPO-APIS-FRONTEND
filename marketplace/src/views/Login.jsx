import LoginForm from "../components/LoginForm";

function Login({ onLogin }) {
  return (
    <LoginForm onLogin={onLogin}></LoginForm>
  )
}

export default Login
