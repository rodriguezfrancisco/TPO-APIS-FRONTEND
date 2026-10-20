import { useState } from 'react';

const useLoginToken = () => {
  const [token, setToken] = useState(localStorage.getItem('jwtToken') || '');

  const login = (newToken) => {
      setToken(newToken);
      localStorage.setItem('jwtToken', newToken);
  };
  
  const logout = () => {
      setToken('');
      localStorage.removeItem('jwtToken');
  };
  
  return { token, login, logout }
};

export default useLoginToken;