# Breath of Fantasy

Solução desenvolvida em JavaScript Vanilla com Node.js para um jogo de batalha em turnos entre dois personagens.

O desafio consiste em simular uma batalha onde dois personagens se alternam entre atacante e defensor até que um deles fique sem pontos de energia. A entrada é recebida via STDIN e a saída é enviada via STDOUT, conforme solicitado no enunciado. :contentReference[oaicite:0]{index=0}

## Objetivo da solução

A principal preocupação desta implementação não foi apenas resolver o problema, mas estruturar o código de forma clara, coesa e fácil de evoluir.

Como o enunciado destaca que serão observados principalmente design de código, coesão, baixo acoplamento e legibilidade, a solução foi organizada separando responsabilidades entre classes específicas. :contentReference[oaicite:1]{index=1}

## Como executar

### Usando pipe

```bash
printf "nome1 40 50\nnome2 50 40\n" | node breath_of_fantasy.js
```

### Usando arquivo de entrada

Crie um arquivo input.txt:
```bash
nome1 40 50
nome2 50 40
```

Execute:
```bash
node breath_of_fantasy.js < input.txt
```

### Execução manual
```bash
node breath_of_fantasy.js
```

Digite:
```bash
nome1 40 50
nome2 50 40
```

Depois pressione:
CTRL + D

## Estrutura da solução

A solução foi organizada nas seguintes classes:

- Character
- LuckService
- AttackResolver
- BattleGame
- InputParser

Além delas, existe a função `main()`, responsável por conectar a entrada, a execução do jogo e a saída.

### Character

A classe Character representa uma personagem do jogo.

Ela concentra apenas os dados e comportamentos diretamente ligados ao personagem:

- nome;
- pontos de energia;
- pontos de poder;
- verificação se ainda está vivo;
- recebimento de dano.

```bash
class Character {
  constructor(name, energy, power) {
    this.name = name;
    this.energy = energy;
    this.power = power;
  }

  isAlive() {
    return this.energy > 0;
  }

  receiveDamage(damage) {
    this.energy = Math.max(0, this.energy - damage);
  }
}
```

A decisão de colocar `isAlive()` dentro da própria classe evita espalhar verificações como `energy > 0` pelo código.

O método `receiveDamage()` também garante que a energia nunca fique negativa, usando `Math.max(0, ...)`.

### LuckService

A classe LuckService é responsável por gerar o fator sorte.

```bash
class LuckService {
  roll() {
    return Math.floor(Math.random() * 101);
  }
}
```

O enunciado define que o fator sorte deve ser um número aleatório de 0 a 100 gerado a cada turno.

Essa responsabilidade foi isolada para evitar que a geração de aleatoriedade fique misturada com a regra de batalha.

### AttackResolver

A classe AttackResolver concentra a regra de cálculo de dano.

```bash
class AttackResolver {
  resolve(attacker, luckFactor) {
    const normalDamage = Math.floor(attacker.power / 3);

    if (luckFactor <= 15) {
      return {
        type: 'miss',
        label: 'Errou',
        damage: 0,
      };
    }

    if (luckFactor <= 70) {
      return {
        type: 'normal',
        label: 'Normal',
        damage: normalDamage,
      };
    }

    if (luckFactor <= 96) {
      return {
        type: 'lucky',
        label: 'Sorte!!!',
        damage: Math.floor(normalDamage * 1.2),
      };
    }

    return {
      type: 'critical',
      label: 'Crítico!',
      damage: normalDamage * 2,
    };
  }
}
```

Essa classe traduz diretamente as faixas do fator sorte:

- 0 a 15: ataque perdido;
- 16 a 70: ataque normal;
- 71 a 96: ataque com sorte;
- 97 a 100: ataque crítico.

A decisão de retornar um objeto com type, label e damage deixa a regra mais expressiva e evita que o restante do código precise conhecer os detalhes internos do cálculo.

### BattleGame

A classe BattleGame representa o motor da batalha.

Ela controla:

- início do jogo;
- alternância entre atacante e defensor;
- execução dos turnos;
- aplicação de dano;
- verificação de fim de jogo;
- geração dos logs de saída.

```bash
class BattleGame {
  constructor(firstCharacter, secondCharacter, attackResolver, luckService) {
    this.firstCharacter = firstCharacter;
    this.secondCharacter = secondCharacter;
    this.attackResolver = attackResolver;
    this.luckService = luckService;
  }

  play() {
    const logs = [];
    let attacker = this.firstCharacter;
    let defender = this.secondCharacter;

    logs.push('O jogo começou');
    logs.push(`Batalha entre ${this.firstCharacter.name} e ${this.secondCharacter.name}`);

    while (attacker.isAlive() && defender.isAlive()) {
      logs.push(`${attacker.name} atacou ${defender.name}`);

      const luckFactor = this.luckService.roll();
      const attackResult = this.attackResolver.resolve(attacker, luckFactor);

      defender.receiveDamage(attackResult.damage);

      logs.push(`${attackResult.label} - ${attackResult.damage} HP`);
      logs.push(`${defender.name}: ${defender.energy} HP`);

      if (!defender.isAlive()) {
        logs.push(`${defender.name} não tem mais energia para lutar.`);
        logs.push(`${attacker.name} venceu a batalha.`);
        break;
      }

      [attacker, defender] = [defender, attacker];
    }

    return logs;
  }
}
```

A alternância de turno foi implementada com destructuring:

```bash
[attacker, defender] = [defender, attacker];
```

Isso deixa explícito que, ao final de cada turno, o defensor passa a ser o atacante e o atacante passa a ser o defensor.

### InputParser

A classe InputParser é responsável por transformar a entrada textual em objetos Character.

```bash
class InputParser {
  parse(rawInput) {
    const lines = rawInput
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length < 2) {
      throw new Error('Entrada inválida. Informe duas linhas no formato: nome energia poder');
    }

    return [this.#parseCharacter(lines[0]), this.#parseCharacter(lines[1])];
  }

  #parseCharacter(line) {
    const [name, energyText, powerText] = line.split(/\s+/);

    const energy = Number.parseInt(energyText, 10);
    const power = Number.parseInt(powerText, 10);

    if (!name || Number.isNaN(energy) || Number.isNaN(power)) {
      throw new Error(`Entrada inválida para personagem: "${line}"`);
    }

    return new Character(name, energy, power);
  }
}
```

Essa separação evita que a função principal ou o motor do jogo precisem conhecer detalhes de parsing.

Também foi usado um método privado #parseCharacter, pois ele é um detalhe interno da classe.

## Validações implementadas

### Ausência de entrada

Logo após a leitura do STDIN, a solução valida se algum conteúdo foi informado:

```bash
if (!rawInput || !rawInput.trim()) {
  console.error('Nenhuma entrada fornecida.');
  process.exit(1);
}
```

Essa validação segue o princípio de falhar cedo, evitando que o programa siga para o parser com uma entrada vazia.

### Quantidade mínima de personagens

O parser valida se existem pelo menos duas linhas de entrada:

```bash
if (lines.length < 2) {
  throw new Error('Entrada inválida. Informe duas linhas no formato: nome energia poder');
}
```

Como a batalha depende de dois personagens, essa regra impede uma execução incompleta.

## Estrutura de cada personagem

Cada personagem precisa seguir o formato:
```bash
nome energia poder
```

A validação verifica se:

- o nome foi informado;
- energia é um número inteiro;
- poder é um número inteiro.

```bash
if (!name || Number.isNaN(energy) || Number.isNaN(power)) {
  throw new Error(`Entrada inválida para personagem: "${line}"`);
}
```

## Decisões de implementação

### Uso de Math.floor

O desafio informa que energia e poder são valores inteiros, mas não especifica o arredondamento para os cálculos fracionários.

Por isso, foi usado `Math.floor()` nos cálculos de dano para manter o dano sempre como valor inteiro.

```bash
const normalDamage = Math.floor(attacker.power / 3);
```

E no ataque de sorte:
```bash
Math.floor(normalDamage * 1.2)
```

### Baixo acoplamento

O BattleGame não cria internamente o AttackResolver nem o LuckService.

Essas dependências são recebidas no construtor:

```bash
new BattleGame(
  firstCharacter,
  secondCharacter,
  new AttackResolver(),
  new LuckService()
);
```

Isso facilita testes e futuras alterações.

### Separação entre domínio e infraestrutura

A leitura do STDIN, escrita no STDOUT e tratamento de erros ficam na função `main()`.

Já as regras de jogo ficam nas classes de domínio.

Essa separação torna o código mais fácil de manter, testar e evoluir.

### Exemplo de entrada

```bash
nome1 40 50
nome2 50 40
```

### Exemplo de saída

Como existe fator sorte aleatório, a saída pode variar:

```bash
O jogo começou
Batalha entre nome1 e nome2
nome1 atacou nome2
Normal - 16 HP
nome2: 34 HP
nome2 atacou nome1
Sorte!!! - 15 HP
nome1: 25 HP
...
nome1 não tem mais energia para lutar.
nome2 venceu a batalha.
```

## Requisitos

- Node.js 18 ou superior recomendado.
- Não há dependências externas.
- Não há uso de frameworks ou bibliotecas de terceiros.

## Conclusão

A solução foi construída com foco em clareza, baixo acoplamento e responsabilidade única.

Cada classe possui um papel bem definido:

- Character: representa a personagem;
- LuckService: gera o fator sorte;
- AttackResolver: calcula o resultado do ataque;
- BattleGame: controla a batalha;
- InputParser: interpreta a entrada;
- main(): conecta entrada, domínio e saída.

Essa organização facilita manutenção, testes e evolução do projeto.
