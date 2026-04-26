import sharp from 'sharp'
import { readFileSync } from 'fs'

const svg = readFileSync('public/apple-touch-icon.svg')
await sharp(svg).resize(180, 180).png().toFile('public/apple-touch-icon.png')
console.log('apple-touch-icon.png generated')
