# Portfólio — Teyson Lorenzon

Portfólio pessoal de **Teyson Lorenzon**, AI Applied Engineer e Desenvolvedor Full Stack Sênior.

O site abre com uma apresentação interativa: uma seção fixa na tela que muda de cena conforme a rolagem, ou sozinha, no modo autoplay. Ela mostra as principais frentes de atuação, da interface ao deploy. Em seguida vêm as seções de perfil, habilidades, experiência, formação e contato.

Feito com **HTML, CSS e JavaScript puros**, sem frameworks, sem dependências e sem etapa de build.

## Apresentação

A apresentação tem cinco cenas:

| Cena | Conteúdo |
| --- | --- |
| Início | Nome, cargo e um editor com `Teyson.java` |
| Frontend | React.js, Next.js, React Native e Angular |
| Backend | Node.js, NestJS, Spring Boot, Quarkus e testes (JUnit, Jest, Playwright) |
| IA aplicada | LLMs, RAG, MCP, LangChain.js e Spec-Driven Development |
| DevOps | Docker, Kubernetes, Jenkins, GitLab e Azure |

Em cada cena, uma pilha de camadas em 3D se abre e mostra as partes daquela frente, por exemplo HTML → CSS → componentes → interface. Ao mesmo tempo, uma palavra gigante, um texto e uma lista de tecnologias entram e saem da tela.

- **Rolagem:** a rolagem da página controla a apresentação, quadro a quadro.
- **Autoplay:** começa sozinho cerca de 2 segundos após abrir a página no topo. Rola em velocidade constante, sem pausas, até a última cena, e para assim que o visitante rola, toca na tela ou usa o teclado.
- **Capítulos:** a barra no canto superior direito tem os botões de reproduzir e pausar e permite pular direto para qualquer cena.
- **Acessibilidade:** quem ativou "reduzir movimento" no sistema não recebe o autoplay automático. Um link "Pular apresentação" aparece ao navegar com Tab.

## Estrutura

```
.
├── index.html   Página e conteúdo (apresentação e seções)
├── style.css    Estilos gerais do site e tokens de design
├── story.css    Estilos da apresentação
├── script.js    Menu, rolagem suave, animações de entrada, cópia de e-mail e tempo nos cargos
└── story.js     Lógica da apresentação e do autoplay
```

## Rodando localmente

Por ser um site estático, basta servir a pasta com qualquer servidor HTTP:

```bash
python3 -m http.server 5500
```

Depois, abra <http://localhost:5500>.

## Personalização

- **Velocidade do autoplay:** a constante `SCENE_MS` em `story.js` define quantos milissegundos o autoplay leva para avançar uma cena.
- **Tempo no cargo atual:** os períodos marcados com `data-since="AAAA-MM"` são calculados automaticamente, contando o mês inicial e o atual, como o LinkedIn:

  ```html
  <span class="timeline-period">Jul 2024 – Atual · <span data-since="2024-07">2 anos e 5 meses</span></span>
  ```

- **Cores e fontes:** os tokens ficam em `:root`, no início de `style.css`.

## Contato

- E-mail: [teyson_lorenzon@hotmail.com](mailto:teyson_lorenzon@hotmail.com)
- LinkedIn: [linkedin.com/in/teyson-lorenzon-597658123](https://www.linkedin.com/in/teyson-lorenzon-597658123/)
