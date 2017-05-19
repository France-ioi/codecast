
function traverse (kind, attrs, children) {
  const newChildren = [];
  for (var child of children) {
    child = traverse(...child);
    if (kind === 'TranslationUnitDecl') {
      if (child[0] === 'CXXRecordDecl') {
        continue; // skip Serial struct
      }
      if (child[0] === 'VarDecl' && child[1].name === 'Serial') {
        continue; // skip Serial var decl
      }
    } else if (child[0] === 'CXXMemberCallExpr') {
      // rewrite Serial.method(…) into Serial_method(…)
      newChildren.push(rewriteCXXMemberCallExpr(...child));
      continue;
    }
    newChildren.push(child);
  }
  return [kind, attrs, newChildren];
}

function rewriteCXXMemberCallExpr (kind, attrs, children) {
  /* [MemberExpr[Name{identifier}, DeclRefExpr[Name{identifier}]], …args] */
  const calleeExpr = children[0];
  if ('MemberExpr' === calleeExpr[0]) {
    const memberName = calleeExpr[2][0];
    const objExpr = calleeExpr[2][1];
    if ('DeclRefExpr' === objExpr[0]) {
      const objName = objExpr[2][0];
      const newName = ['Name', {
        id: memberName[1].id, /* not incorrect */
        begin: objName[1].begin,
        end: memberName[1].end,
        identifier: `${objName[1].identifier}_${memberName[1].identifier}`
      }, []];
      kind = 'CallExpr';
      children[0] = ['DeclRefExpr', calleeExpr[1], [newName]];
    } else {
      console.log('CXXMemberCallExpr: expected DeclRefExpr');
    }
  } else {
    console.log('CXXMemberCallExpr: expected MemberExpr');
  }
  return [kind, attrs, children];
}

module.exports.transform = function (ast) {
  return traverse(...ast);
};
