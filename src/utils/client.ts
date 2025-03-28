import axios, { AxiosInstance } from 'axios';
import { API_URL } from './helpers';

const client: AxiosInstance = axios.create({
  baseURL: API_URL,
});

export default client;
