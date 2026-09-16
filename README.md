# Magic Bar Events

Crie um aplicativo web full-stack responsivo e profissional para a empresa de drinks MAGIC BAR, destinado à criação de orçamentos para eventos.

As imagens anexadas a este prompt são referências visuais oficiais do cardápio atual da MAGIC BAR.

IMPORTANTE: analise as imagens anexadas antes de construir a interface.

A primeira imagem representa a categoria básica de drinks.

A segunda imagem representa as categorias premium divididas visualmente por faixas coloridas.

A faixa ROXA representa uma categoria de preço.

A faixa AZUL/CIANO representa outra categoria de preço.

A faixa VERDE representa a categoria premium de maior valor.

Os drinks devem ser recriados individualmente como cards selecionáveis.

NÃO colocar as imagens completas como uma única imagem dentro do aplicativo.

Usar as imagens apenas como referência para reconstruir a interface e os cards.

1. OBJETIVO

O sistema será um Gerador de Orçamentos da MAGIC BAR.

O usuário preencherá:

Dados do contratante

Tipo de evento

Dados do evento

Local do evento

Quantidade de adultos

Quantidade de crianças

Seleção de 4 a 6 drinks

O sistema calculará automaticamente:

preço por pessoa;

valor dos adultos;

valor das crianças;

aluguel das taças/copos;

frete;

valor total.

O orçamento deve ser atualizado em tempo real.

2. PRINCÍPIO FUNDAMENTAL DO SISTEMA DE PREÇOS

NÃO deixar os valores de preço fixos diretamente no código.

Toda a estrutura de preços deve ficar armazenada no banco de dados/Supabase.

Criar uma estrutura de configuração que permita ao administrador alterar os valores pelo painel administrativo.

Por exemplo:

pricing_settings

base_4_drinks = 29
base_5_drinks = 30
base_6_drinks = 31

purple_1_drink = 35
purple_2_plus_drinks = 36

blue_1_drink = 40
blue_2_plus_drinks = 41

green_initial_price = 45
green_increment = 1

glass_rental_per_person = 3

child_percentage = 50

minimum_freight = 100
freight_per_km = X
maximum_distance = X


Esses valores são apenas os valores iniciais.

O administrador deverá conseguir alterar todos eles pelo painel.

A lógica do aplicativo deve consultar essas configurações.

3. IDENTIDADE VISUAL

Nome:

MAGIC BAR

Criar identidade visual premium inspirada nas imagens fornecidas.

Características:

fundo claro;

preto predominante;

vermelho como cor de destaque;

aparência sofisticada;

elegante;

relacionada a casamentos, aniversários e eventos premium;

cards arredondados;

sombras suaves;

animações discretas;

excelente experiência mobile.

Evitar aparência de formulário administrativo.

O aplicativo deve parecer uma ferramenta comercial premium.

4. FLUXO

Criar um fluxo em etapas:

Contratante → Evento → Local → Convidados → Drinks → Orçamento

Mostrar uma barra de progresso.

O usuário deve conseguir voltar para qualquer etapa sem perder os dados.

5. CONTRATANTE

Campos:

Nome

Obrigatório.

CPF

Obrigatório.

Aplicar máscara:

000.000.000-00

O nome e CPF são referentes à pessoa que ficará no contrato.

6. TIPO DE EVENTO

Mostrar cards:

Noivos

Debutante

Aniversariante

Somente uma opção pode ser selecionada.

Noivos

Ao selecionar:

Mostrar:

Nome do noivo

Nome da noiva

Debutante

Mostrar:

Nome da debutante

Aniversariante

Mostrar:

Nome do aniversariante

Esses campos devem aparecer dinamicamente.

7. LOCAL DO EVENTO

Campos:

CEP

Endereço

Número

Complemento

Cidade

Estado

Calcular automaticamente a distância entre a origem configurada da MAGIC BAR e o endereço do evento.

Mostrar:

Distância estimada: XX km

Frete: R$ XXX,XX

8. FRETE

O frete deve ser configurável pelo administrador.

Configurações:

endereço de origem;

preço por km;

frete mínimo;

distância máxima;

cidades/regiões atendidas.

Valor inicial:

Frete mínimo = R$ 100,00

O valor calculado nunca poderá ser inferior ao frete mínimo.

Criar também uma limitação geográfica.

A MAGIC BAR deverá conseguir definir uma distância máxima de atendimento.

Caso o evento esteja fora da área:

"Este endereço está fora da área de atendimento da MAGIC BAR."

Não permitir concluir o orçamento.

IMPORTANTE:

Não deixar nenhum valor de frete hardcoded.

9. DATA E HORÁRIOS

Campos:

Data do evento

Horário de abertura do buffet

Horário de abertura do BAR

Horário de abertura do DJ

Esses horários são apenas informativos neste momento.

Não alterar o preço automaticamente.

Porém, armazenar os dados para futura análise comercial.

10. CONVIDADOS

Criar controles:

Adultos

[-] quantidade [+]

Crianças

[-] quantidade [+]

Crianças consideradas:

0 a 5 anos.

11. CÁLCULO DOS CONVIDADOS

O preço do pacote representa o valor integral por adulto.

Adicionar:

+ R$ 3,00 por pessoa para aluguel de taças/copos

Esse valor também deve ser configurável no painel administrativo.

Adulto

Preço do pacote + aluguel da taça/copo.

Criança

50% do preço do pacote + aluguel da taça/copo.

O percentual infantil também deve ser configurável.

Exemplo:

Pacote = R$ 29

Adulto:

R$ 29 + R$ 3 = R$ 32

Criança:

R$ 14,50 + R$ 3 = R$ 17,50

12. SELEÇÃO DOS DRINKS

Criar uma etapa visual:

Monte seu cardápio

Texto:

Escolha de 4 a 6 drinks

Mostrar:

0 / 6 drinks selecionados

Não permitir menos de 4 para finalizar.

Não permitir mais de 6.

Cada drink deve ser um card contendo:

imagem;

nome;

ingredientes;

categoria;

botão/área de seleção.

Ao selecionar:

destacar card;

mostrar ✓;

atualizar contador;

atualizar preço;

atualizar orçamento.

13. RESUMO FLUTUANTE

Criar um resumo flutuante sempre visível.

No desktop:

painel lateral.

No mobile:

barra fixa na parte inferior.

Exemplo:

5 drinks selecionados

R$ 35,00 / pessoa

Total: R$ 3.850,00

Botão:

Ver orçamento

Esse resumo deve atualizar instantaneamente.

14. CATEGORIA 1 — BÁSICOS

Usar a primeira imagem como referência.

Criar os seguintes drinks:

Tropical

Gin / Vodka

Manga
Maracujá
Energético Tropical

Maçã Verde

Gin / Vodka

Limão
Energético Maçã Verde

Moranguete

Gin / Vodka

Morango
Energético
Melancia

Caipirinha

Velho Barreiro
Vodka
Jurupinga

Opções:

Limão
Rúcula e limão
Morango e limão
Rapadura e limão
Abacaxi e limão

Moscow Mule

Vodka / Gin
Limão
Hortelã
Suco de gengibre
Espuma de gengibre

Gin Tônica

Gin
Limão
Tônica

Soda Italiana

SEM ÁLCOOL

Morango
Manga
Abacaxi
Limão

Cuba Libre

Rum
Suco de limão
Coca-Cola
Limão

Mojito

Rum
Limão
Hortelã
Água com gás

15. REGRA DE PREÇO — BÁSICOS

Os valores devem vir do banco de dados.

Configuração inicial:

4 drinks:

R$ 29,00

5 drinks:

R$ 30,00

6 drinks:

R$ 31,00

Não permitir menos de 4 drinks no fechamento.

Não permitir mais de 6.

16. CATEGORIA 2 — ROXA

Usar a segunda imagem como referência visual.

Criar:

Batidinha

Vodka ou Gin
Morango
Leite condensado

Sex on the Beach

Vodka
Laranja
Groselha
Licor de pêssego

Mimosa

Espumante
Suco de laranja

Piña Colada

Rum
Suco de abacaxi
Leite de coco
Leite condensado

Espanhola

Vinho
Morango
Leite condensado

Cosmopolitan

Vodka
Licor de laranja
Suco de limão
Suco de cranberry

Visualmente, essa categoria deve possuir uma identificação:

PREMIUM

e utilizar uma tonalidade roxa.

17. REGRA DE PREÇO — ROXA

Se houver 1 drink roxo:

R$ 35,00

Se houver 2 ou mais:

R$ 36,00

Não aumentar além de R$ 36 devido à quantidade de drinks roxos.

Exemplos:

1 roxo → R$ 35

2 roxos → R$ 36

3 roxos → R$ 36

6 roxos → R$ 36

18. CATEGORIA 3 — AZUL/CIANO

Usar a faixa azul/ciano da imagem como referência.

Drinks:

Aperol Spritz

Aperol
Espumante
Rodela de laranja
Água com gás

Margarita

Tequila
Licor de laranja
Limão
Borda de sal

Fitzgerald

Gin
Suco de limão siciliano
Hortelã
Xarope de açúcar
Angostura

Identificar visualmente como:

SUPER PREMIUM

19. REGRA DE PREÇO — AZUL

1 drink:

R$ 40,00

2 ou mais:

R$ 41,00

Exemplo:

1 azul → R$ 40

2 azuis → R$ 41

3 azuis → R$ 41

20. CATEGORIA 4 — VERDE / WHISKY

Usar a faixa verde da imagem como referência.

Drinks:

Negroni

Campari
Gin
Vermute tinto
Laranja

Old Fashioned

Whiskey
Xarope de açúcar
Angostura
Água com gás
Casca de laranja

Maracujack

Whiskey
Jack Daniel's Nº 7
Suco de limão
Polpa de maracujá
Soda
Hortelã

Penicillin

Whiskey
Suco de limão siciliano
Xarope de mel
Fatias de gengibre

Manhattan

Bourbon
Vermute rosso
Angostura
Calda de cereja
Cereja

Identificar como:

WHISKY / PREMIUM ESPECIAL

21. REGRA DE PREÇO — VERDE

Preço inicial:

R$ 45,00

Cada drink adicional dessa categoria aumenta R$ 1.

Exemplo:

1 verde → R$ 45

2 verdes → R$ 46

3 verdes → R$ 47

4 verdes → R$ 48

5 verdes → R$ 49

Essa categoria não possui teto de R$ 46.

O incremento deve continuar conforme a quantidade selecionada.

22. HIERARQUIA DAS CATEGORIAS

Essa regra é fundamental.

O sistema deve analisar os drinks selecionados e aplicar o preço da categoria de maior nível.

Hierarquia:

Básico < Roxo < Azul < Verde

Exemplos:

4 básicos:

R$ 29

3 básicos + 1 roxo:

R$ 35

2 básicos + 2 roxos:

R$ 36

3 básicos + 1 azul:

R$ 40

2 básicos + 2 roxos + 1 azul:

R$ 40

2 básicos + 2 roxos + 1 verde:

R$ 45

2 básicos + 2 roxos + 2 verdes:

R$ 46

O sistema NÃO deve somar preços das categorias.

Ele deve identificar a categoria de maior nível e aplicar a regra correspondente.

23. ARQUITETURA DE PREÇOS NO BANCO

Criar uma tabela/configuração de preços.

Cada categoria deve possuir parâmetros editáveis.

Exemplo conceitual:

category: basic
pricing_type: quantity_range
4 drinks: 29
5 drinks: 30
6 drinks: 31

category: purple
pricing_type: tier
1 drink: 35
2+ drinks: 36

category: blue
pricing_type: tier
1 drink: 40
2+ drinks: 41

category: green
pricing_type: incremental
starting_price: 45
increment: 1


O código deve consultar essas configurações.

Não colocar esses números diretamente dentro dos componentes React.

24. PAINEL ADMINISTRATIVO

Criar área administrativa com login.

Permitir editar:

Frete

endereço de origem;

valor por km;

frete mínimo;

distância máxima;

cidades atendidas.

Preços

preço básico para 4 drinks;

preço básico para 5;

preço básico para 6;

preço roxo para 1;

preço roxo para 2+;

preço azul para 1;

preço azul para 2+;

preço inicial verde;

incremento verde;

aluguel de taças;

percentual das crianças.

Drinks

CRUD completo:

criar;

editar;

excluir;

ativar/desativar;

alterar nome;

alterar ingredientes;

alterar imagem;

alterar categoria.

25. IMPORTANTE SOBRE IMAGENS DOS DRINKS

A interface deve permitir posteriormente cadastrar uma imagem individual para cada drink.

A imagem enviada neste prompt é apenas referência visual.

O sistema deve estruturar os drinks individualmente.

Exemplo:

Drink
├── nome
├── ingredientes
├── categoria
├── imagem
├── ativo
└── ordem


Assim o administrador poderá substituir as imagens posteriormente.

26. ORÇAMENTO EM TEMPO REAL

Exibir:

Resumo

Drinks:

5 / 6

Preço do pacote:

R$ 35,00 / pessoa

Aluguel:

R$ 3,00 / pessoa

Adultos:

100 × R$ 38 = R$ 3.800

Crianças:

10 × R$ 20,50 = R$ 205

Frete:

R$ 150

TOTAL

R$ 4.155,00

Atualizar instantaneamente.

27. INDICAÇÃO DE ALTERAÇÃO DE PREÇO

Quando uma seleção fizer o preço aumentar, mostrar uma pequena notificação.

Exemplo:

Novo drink premium selecionado

R$ 31 → R$ 35 por pessoa

Ou:

Drink Whisky selecionado

R$ 41 → R$ 45 por pessoa

A alteração deve ser clara e elegante.

28. TELA FINAL

Criar um orçamento visualmente profissional:

MAGIC BAR

ORÇAMENTO

Contratante

Nome
CPF

Evento

Tipo de evento
Nome do aniversariante/debutante/noivos

Local

Endereço
Distância
Frete

Data

Data do evento
Abertura buffet
Abertura BAR
Abertura DJ

Convidados

Adultos
Crianças

Drinks

Lista completa dos drinks escolhidos.

Valores

Preço por adulto
Preço por criança
Aluguel
Frete

TOTAL

R$ X.XXX,XX

29. EXPORTAÇÃO

Botões:

Gerar PDF

Enviar WhatsApp

Editar

O PDF deve ter aparência de orçamento comercial da MAGIC BAR.

A mensagem de WhatsApp deve conter:

Nome
Evento
Data
Local
Adultos
Crianças
Drinks
Preço por pessoa
Frete
Total

30. TESTES OBRIGATÓRIOS

Criar testes para:

4 básicos → R$ 29

5 básicos → R$ 30

6 básicos → R$ 31

1 roxo → R$ 35

2 roxos → R$ 36

6 roxos → R$ 36

1 azul → R$ 40

2 azuis → R$ 41

1 verde → R$ 45

2 verdes → R$ 46

3 verdes → R$ 47

Mistura básico + roxo → aplicar roxo

Mistura básico + azul → aplicar azul

Mistura roxo + azul → aplicar azul

Mistura básico + roxo + verde → aplicar verde

Mistura de qualquer quantidade de categorias inferiores + verde → aplicar regra verde.

31. RESULTADO ESPERADO

O aplicativo deve ser funcional e pronto para uso comercial.

Não criar apenas uma demonstração visual.

Criar:

frontend;

backend;

banco Supabase;

autenticação administrativa;

cadastro de drinks;

configuração de preços;

cálculo de orçamento;

cálculo de frete;

cálculo de adultos/crianças;

seleção de drinks;

geração de orçamento;

PDF;

WhatsApp.

Prioridade:

Correção da lógica de preços.

Cálculo correto do orçamento.

Experiência de seleção dos drinks.

Interface premium.

Painel administrativo.

PDF e WhatsApp.

Use as imagens anexadas como referência visual direta durante a construção. Analise principalmente a organização dos drinks, tipografia, composição, categorias e faixas coloridas.

Não reproduza a imagem inteira como um elemento único da interface. Recrie o cardápio como uma interface interativa e moderna.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://magic-bar-orcamentos.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/edd8be62-0c94-49a3-9e9d-d23676b431c7).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
