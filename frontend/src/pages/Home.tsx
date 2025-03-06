import LoginForm from '../components/LoginForm';
import logo from '/src/assets/logo.png'; 
import '../home.css'

const Home = () => {
  return (
    <div className="home-container">
      <div className="login-container">
      <img src={logo} alt="Logo" className="logo mx-auto mb-4" />
        <LoginForm centered />
      </div>
    </div>
  );
};

export default Home;

