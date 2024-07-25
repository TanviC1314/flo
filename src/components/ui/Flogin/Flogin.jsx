// ./CRM/Frontend/src/components/ui/Flologin.jsx
import React from 'react';

const Flologin = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-customBlue">
      <div className="bg-white p-10 rounded-lg shadow-lg w-full max-w-sm mx-4">
        <h2 className="text-2xl font-semibold text-center mb-6 text-customBlue">Welcome to FloBridge</h2>
        <p className="text-center mb-6 text-gray-600">Please enter your credentials to access the CRM</p>
        <form>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-customBlue-light"
              placeholder="Enter your username"
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 mb-2" htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-customBlue-light"
              placeholder="Enter your password"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-customBlue text-white py-2 rounded-lg hover:bg-customBlue-light transition duration-200"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Flologin;
