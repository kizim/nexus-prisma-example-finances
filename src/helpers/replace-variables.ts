export default (body: any) => {
  let query = body.query.replace(/(\r\n|\n|\r)/gm, "").match(/{(.*)}/g)[0];
  const variables = body.variables;
  Object.keys(variables).map(item => {
    query = query.replace(`$${item}`, variables[item])
  });

  const data = {
    query,
    variables: {},
    operationName: null,
  }

  return data;
}