// Test script to verify backend API
const testCode = `public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello from test!");
    }
}`;

fetch('http://localhost:3001/api/compile', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    code: testCode,
    language: 'java',
    versionIndex: '4'
  })
})
.then(response => {
  console.log('Status:', response.status);
  return response.json();
})
.then(data => {
  console.log('Response:', data);
})
.catch(error => {
  console.error('Error:', error);
});
