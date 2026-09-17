import { expect } from 'chai';
import request from 'supertest';

import app from '../src/app.js';

import testData from './data/alunos.json' with { type: 'json' };

import { loginAdmin } from './helpers/loginAdmin.js';
import { loginUser } from './helpers/loginUser.js';

describe('Fluxo de gestão de aluno', function () {
  this.timeout(10000);

  let adminToken;

  before(async function () {
    adminToken = await loginAdmin(request(app), testData.admin);

    expect(adminToken).to.be.a('string');
    expect(adminToken).to.not.be.empty;
  });

  testData.alunos.forEach((aluno) => {
    describe(`Aluno: ${aluno.nome}`, function () {
      let alunoId;
      let alunoToken;

      it('deve cadastrar o aluno como administrador', async function () {
        const response = await request(app)
          .post('/api/admin/alunos')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            nome: aluno.nome,
            email: aluno.email,
            matricula: aluno.matricula,
            senha: aluno.senha
          });

        expect(response.status).to.equal(201);

        expect(response.body).to.have.property('id');
        expect(response.body.nome).to.equal(aluno.nome);
        expect(response.body.email).to.equal(aluno.email);
        expect(response.body.matricula).to.equal(aluno.matricula);
        expect(response.body.role).to.equal('aluno');

        alunoId = response.body.id;
      });

      it('deve matricular o aluno na disciplina', async function () {
        const response = await request(app)
          .post(`/api/admin/disciplinas/${aluno.disciplinaId}/matriculas`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            alunoId
          });

        expect(response.status).to.equal(201);
        expect(response.body).to.have.property('alunoId', alunoId);
        expect(response.body).to.have.property(
          'disciplinaId',
          aluno.disciplinaId
        );
      });

      it('deve realizar login como aluno', async function () {
        alunoToken = await loginUser(request(app), {
          email: aluno.email,
          senha: aluno.senha
        });

        expect(alunoToken).to.be.a('string');
        expect(alunoToken).to.not.be.empty;
      });

      it('deve registrar a entrega de um trabalho como aluno', async function () {
        const response = await request(app)
          .post(`/api/alunos/${alunoId}/trabalhos`)
          .set('Authorization', `Bearer ${alunoToken}`)
          .send({
            disciplinaId: aluno.disciplinaId,
            titulo: aluno.trabalho.titulo,
            descricao: aluno.trabalho.descricao
          });

        expect(response.status).to.equal(201);

        expect(response.body).to.have.property('id');
        expect(response.body.alunoId).to.equal(alunoId);
        expect(response.body.disciplinaId).to.equal(aluno.disciplinaId);
        expect(response.body.titulo).to.equal(aluno.trabalho.titulo);
        expect(response.body.descricao).to.equal(aluno.trabalho.descricao);
        expect(response.body.status).to.equal('entregue');
      });
    });
  });
});