'use strict';

const fs = require('fs');

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

class LuckService {
  roll() {
    return Math.floor(Math.random() * 101);
  }
}

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

function main() {
  try {
    const rawInput = fs.readFileSync(0, 'utf8');

    if (!rawInput || !rawInput.trim()) {
        console.error('Nenhuma entrada fornecida.');
        process.exit(1);
    }

    const lines = rawInput
        .split(/\r?\n/)
        .map(l => l.trim())
        .filter(Boolean);

        if (lines.length < 2) {
        console.error('Entrada inválida. Informe dois personagens.');
        process.exit(1);
    }

    const parser = new InputParser();
    const [firstCharacter, secondCharacter] = parser.parse(rawInput);

    const game = new BattleGame(
      firstCharacter,
      secondCharacter,
      new AttackResolver(),
      new LuckService(),
    );

    const output = game.play();
    process.stdout.write(`${output.join('\n')}\n`);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exit(1);
  }
}

main();
