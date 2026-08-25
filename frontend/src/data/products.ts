import type { Product } from '../types/product'

import galxayS24Image from '../assets/products/s24.png'
import galaxyA55Image from '../assets/products/a55.png'
import galaxyS24UltraImage from '../assets/products/s24u.png'

import iphone15Image from '../assets/products/i15.png'
import iphone15ProImage from '../assets/products/i15p.png'
import iphone16Image from '../assets/products/i16.png'


import motorolaG85Image from '../assets/products/g85.png'
import motorolaEdge50Image from '../assets/products/e50.png'
import motorolaRazr50Image from '../assets/products/r50.png'

import xiaomiNote13Image from '../assets/products/n13.png'
import xiaomiNote13ProImage from '../assets/products/n13p.png'
import xiaomi14Image from '../assets/products/x14.png'



export const products: Product[] = [
  {
    id: 1,
    name: 'Galaxy S24',
    brand: 'Samsung',
    price: 4299.9,
    color: '#8a9a9d',
    image: galxayS24Image,
  
  },

  {
    id: 2,
    name: 'Galaxy A55',
    brand: 'Samsung',
    price: 2299.9,
    color: '#607d8b',
    image: galaxyA55Image,

  },

  {
    id: 3,
    name: 'Galaxy S24 Ultra',
    brand: 'Samsung',
    price: 6499.9,
    color: '#4b5263',
    image: galaxyS24UltraImage,
  },

  {
    id: 4,
    name: 'iPhone 15',
    brand: 'Apple',
    price: 4899,
    color: '#b8c9d8',
    image: iphone15Image,
  
  },

  {
    id: 5,
    name: 'iPhone 15 Pro',
    brand: 'Apple',
    price: 6499,
    color: '#8c8c88',
    image: iphone15ProImage,
  },

  {
    id: 6,
    name: 'iPhone 16',
    brand: 'Apple',
    price: 5799,
    color: '#a8b5a5',
    image: iphone16Image,

  },

  {
    id: 7,
    name: 'Edge 50 Pro',
    brand: 'Motorola',
    price: 2999.9,
    color: '#66728b',
    image: motorolaEdge50Image,
  },

  {
    id: 8,
    name: 'Moto G85',
    brand: 'Motorola',
    price: 1899.9,
    color: '#7d8f83',
    image: motorolaG85Image,
  
  },

  {
    id: 9,
    name: 'Razr 50',
    brand: 'Motorola',
    price: 4999.9,
    color: '#9b8798',
    image: motorolaRazr50Image,

  },

  {
    id: 10,
    name: 'Redmi Note 13',
    brand: 'Xiaomi',
    price: 1599.9,
    color: '#d4b6a6',
    image: xiaomiNote13Image,
  },

  {
    id: 11,
    name: 'Redmi Note 13 Pro',
    brand: 'Xiaomi',
    price: 2199.9,
    color: '#727b8f',
    image: xiaomiNote13ProImage,
  
  },

  {
    id: 12,
    name: 'Xiaomi 14',
    brand: 'Xiaomi',
    price: 4299.9,
    color: '#555d68',
    image: xiaomi14Image,
   
  },
]