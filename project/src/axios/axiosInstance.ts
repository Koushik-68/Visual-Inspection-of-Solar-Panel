// src/api/axiosInstance.ts

import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:5000/", // Your backend base URL
  withCredentials: true, // Important for sending cookies/session
});

export default axiosInstance;
