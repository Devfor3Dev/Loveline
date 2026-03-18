import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Le proxy n'est utile qu'en développement local
})
```

### 2. Créer un fichier `.env.production` à la racine de ton projet React
```
VITE_API_URL=https://ton-backend.onrender.com
})
