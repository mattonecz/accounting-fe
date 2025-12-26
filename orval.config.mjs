export default {
  petstore: {
    output: { 
      mode: 'tags-split',
      target: 'src/api/',
      schemas: 'src/api/model',
      client: 'react-query',
  
    },
    input: {
      target: './api.json',
    },
  },
};