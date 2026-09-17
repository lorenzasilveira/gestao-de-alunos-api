export async function loginAdmin(request, credentials) {
  const response = await request
    .post('/api/auth/login')
    .send({
      email: credentials.email,
      senha: credentials.senha
    })
    .expect(200);

  return response.body.token;
}