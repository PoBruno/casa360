# Casa360

Casa360 é um sistema full-stack open source para a gestão financeira doméstica – o verdadeiro ERP doméstico. A ideia surgiu da necessidade de termos um único lugar para armazenar tudo o que diz respeito à administração do nosso cotidiano: desde comprovantes de contas antigas, passando pelo controle dos serviços de streaming e armazenamento em nuvem, até a análise detalhada para grandes investimentos, como a compra de uma casa.  

## Nossa Ideia

Vivemos num mundo onde as informações são o novo ouro. Pensamos que seria incrível ter uma plataforma onde você pudesse, com apenas alguns cliques, consultar aquele comprovante de uma conta antiga, acompanhar seus gastos com serviços de streaming ou drive cloud, ou até mesmo realizar uma análise de mercado completa para aquela compra importante. Seja você alguém que quer ter um controle simples das finanças do dia a dia ou um entusiasta que deseja elaborar RFPs, cadastrar lojas, monitorar preços e estudar o mercado, o Casa360 foi pensado para oferecer uma visão 360° da vida no lar. Nosso objetivo é trazer estratégias de mercado para a gestão integral do lar, facilitando a tomada de decisões e permitindo uma administração completa de todos os aspectos domésticos.

## Funcionalidades

- **Gestão Financeira Integrada:** Controle suas contas, receitas e despesas, com suporte para lançamentos recorrentes, parcelamentos e dashboards interativos.
- **Compras e RFPs Domésticos:** Crie solicitações de compra, cadastre fornecedores, sites e lojas, e acompanhe os preços dos produtos para realizar análises de mercado.
- **Organização de Documentos:** Armazene comprovantes, notas fiscais e outros documentos em um único lugar, facilitando consultas futuras.
- **Gerenciamento de Tarefas e Afazeres:** Mantenha um registro de afazeres e tarefas, integrando a administração financeira com a organização pessoal.
- **Histórico e Auditoria:** Acompanhe cada alteração e atualização com registros detalhados, garantindo transparência e controle total sobre as operações.

## Arquitetura do Projeto

Casa360 foi desenvolvido com tecnologias modernas para proporcionar desempenho, escalabilidade e segurança:

- **Back-end:**  
  - Framework: [Express](https://expressjs.com/)  
  - Linguagem: Node.js com TypeScript  
  - Banco de Dados: PostgreSQL, com um sistema robusto de triggers, funções e constraints para garantir a integridade dos dados

- **Documentação:**  
  - [Backend Documentation](server/README.md)  
  - [API Documentation](server/API.md)

## Contribua

Casa360 é um projeto open source, e toda contribuição é bem-vinda! Se você tem ideias para melhorar o sistema, corrigir bugs ou adicionar novas funcionalidades, siga os passos abaixo:

1. **Fork** este repositório.
2. Crie uma nova **branch** com a sua feature ou correção: `git checkout -b minha-feature`.
3. Faça seus **commits** com mensagens claras.
4. Envie um **Pull Request** detalhando as alterações realizadas.
5. Aguarde a revisão e feedback da comunidade.

## Instalação e Execução

1. **Clone o Repositório:**
   ```bash
   git clone https://github.com/seu-usuario/casa360.git
   cd casa360
   ```
   