export default (body: any) => {
  let query = body.query.replace(/(\r\n|\n|\r)/gm, "").match(/{(.*)}/g)[0];
  
  if (body.query.includes('mutation')) {
    query = 'mutation ' + query;
  }

  const variables = body.variables;
  Object.keys(variables).map(item => {
    const variable = JSON.stringify(variables[item]);
    query = query.replace(`$${item}`, variable
      .replace(/("(\w+)":)/gim, (_, __, key) => `${key}:` ));
  });

  const data = {
    query,
    variables: {},
    operationName: null,
  }

  return data;
}