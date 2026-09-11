const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  `  const handleLogout = async () => {\n    try {\n      await logout();\n    } catch (e) {\n      console.error(e);\n    }`,
  `  const handleLogout = async () => {\n    try {\n      customSignOut();\n      await logout();\n    } catch (e) {\n      console.error(e);\n    }`
);

fs.writeFileSync('src/App.tsx', content);
