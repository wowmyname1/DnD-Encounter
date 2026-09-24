
function calculateSpellDC(spell, caster) {
  if (!spell.logic.save) return 10;
  
  if (spell.logic.save.dcFormula) {
    const formula = spell.logic.save.dcFormula;
    const prof = caster ? Math.ceil((caster.level || 1) / 4) + 1 : 2;
    const spellAbility = spell.logic.save.ability?.toLowerCase();
    const abilityScore = caster?.abilities?.[spellAbility] || 10;
    const mod = Math.floor((abilityScore - 10) / 2);
    
    let dc = formula
      .replace(/prof/g, prof)
      .replace(/mod/g, mod)
      .replace(/\s+/g, '');
    
    try {
      const parts = dc.split(/([+-])/);
      let result = parseInt(parts[0]) || 0;
      for (let i = 1; i < parts.length; i += 2) {
        const op = parts[i];
        const val = parseInt(parts[i + 1]) || 0;
        if (op === '+') result += val;
        if (op === '-') result -= val;
      }
      return result;
    } catch (e) {
      return 10 + prof + mod;
    }
  }
  
  if (caster) {
    const prof = Math.ceil((caster.level || 1) / 4) + 1;
    const spellAbility = spell.logic.save.ability?.toLowerCase();
    const abilityScore = caster?.abilities?.[spellAbility] || 10;
    const mod = Math.floor((abilityScore - 10) / 2);
    return 8 + prof + mod;
  }
  
  return 13;
}
