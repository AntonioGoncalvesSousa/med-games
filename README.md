# Med/Games

Plataforma web educativa para estudo de Anatomia. A primeira experiência é o **Adivinhe o Osso**, um jogo de identificação com visualização 3D em Three.js.

## Tecnologias

- React + Vite em JavaScript
- Three.js, `GLTFLoader` e `OrbitControls`
- CSS modular, sem frameworks de UI

## Executar

```bash
npm install
npm run dev
```

Para validar a build de produção:

```bash
npm run build
```

## Modelo Z-Anatomy

O visualizador carrega o modelo em `public/models/z-anatomy/anatomy.glb`. O arquivo atual foi colocado nesse caminho e os identificadores das estruturas foram conferidos diretamente na hierarquia do GLB. Preserve os créditos e arquivos de licença da distribuição do Z-Anatomy ao redistribuir o projeto. Se o asset não estiver presente em outra instalação, a aplicação usa uma pré-visualização 3D de desenvolvimento e sinaliza isso na tela.

Os nomes das meshes foram obtidos por `object.name` e registrados em `meshNames` em `src/data/anatomyData.js`. O componente `AnatomyViewer` mantém a cena persistente e controla o destaque individual sem recriar o renderer.

## Estrutura

- `src/data`: regiões e estruturas anatômicas apresentadas ao usuário
- `src/game`: embaralhamento e métricas da partida
- `src/hooks`: estado da fila, respostas, passar e flashcards
- `src/components`: telas, controles e visualizador Three.js
- `src/styles`: linguagem visual responsiva

## Expandir

Para adicionar estruturas, inclua um objeto com `id`, `nome`, `categoria`, `regiao`, `aliases` e os `meshNames` reais do modelo. Novos jogos podem ser adicionados ao array `games` em `src/App.jsx` e encaminhados para telas próprias sem alterar o estado base da partida.

## Créditos e licença

Modelos anatômicos baseados no projeto Z-Anatomy. Consulte a licença original do material usado e mantenha a atribuição ao redistribuir arquivos convertidos ou modificados.