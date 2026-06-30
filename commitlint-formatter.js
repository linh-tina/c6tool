module.exports = (data = {}) => {
  const results = data.results || [];
  let output = "";

  for (const result of results) {
    const message = result.input;
    if (result.errors.length > 0 || result.warnings.length > 0) {
      output += `\n⚠️  [WARN] Invalid commit subject format: '${message}'\n`;
      output += `❌ [ERROR] Invalid commit message\n`;
      output += `✅  Valid message pattern: <TYPE>[(<SCOPE>)]: <DESCRIPTION>\n`;
    }
  }

  return output.trim() + "\n";
};
