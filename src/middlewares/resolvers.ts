import { Context } from "../context";
import { TransactionCreateInput, Transaction, TransactionCreateArgs } from "@generated/photon";
import { isArray, flattenDeep } from 'lodash';

const inputTypesValidators: any = {
  AccountWhereUniqueInput: (inputValue: any, args: any) => () => !args.context.user && inputValue.id === '10',
  Float: (inputValue: any, args: any) => () => 'Privet',
  String: (inputValue: any, args: any) => () => args.context.user.email
}

const defaultValidators = {
  required: (value: any, args: any) => () => !!value
}

const systemTypes = ['Mutation', 'Query'];

const transformType = (type: any, systemField = false): any => {
  if (systemTypes.includes(type.name)) {
    const fields = type._fields;
    return Object.assign({}, ...Object.keys(fields).map((key) => transformType(fields[key], true)));
  }

  if (systemField) {

    return {
      [type.name]: {
        arguments: type.args && Object.assign({}, ...type.args.map(transformType)) || {}
      }
    }
  }

  if (type.type) {

    return { [type.name]: type.type.toString() };
  }

  const fields = type._fields
  if (fields) {
    return {
      [type.name]: Object.assign({}, ...Object.keys(fields).map(key => transformType(fields[key])))
    }
  }

  return 'Scalar';
}

const transformSchema = (schema: any) => {
  return Object.keys(schema._typeMap).reduce((r, key) => {
    const type = schema._typeMap[key];
    
    if (/^_+/gim.test(key)) {
      return r;
    } else {
      return { ...r, [key]: transformType(type) };
    }

  }, {})
}

const schema: any = {
  Float: "Scalar",
  Mutation: {
    createTransaction: {
      arguments: {
        data: 'TransactionCreateInput',
      }
    }
  },
  TransactionCreateInput: {
    amount: "Float!",
    udpdatedAt: "DateTime!",
    createdAt: "DateTime!",
    account: 'AccountCreateOneWithoutAccountInput!'
  },
  AccountCreateOneWithoutAccountInput: {
    create: 'AccountCreateWithoutTransactionsInput',
    connect: 'AccountWhereUniqueInput!'
  },
  AccountWhereUniqueInput: { 
    id: "String!"
  },
  AccountCreateWithoutTransactionsInput: {
    name: "String!"
  }
}

// const flatArrayToObject =  

const getName = (nameField: any) => nameField.kind === 'Name' && nameField.value || nameField;

const getOperationName = (valueField: any) => {
  const alias = valueField.alias && getName(valueField.alias);
  const name = valueField.name && getName(valueField.name);

  return alias && `${alias}:${name}` || name;
}

const extractOperationName = (operationName: string) => {
  const parts = operationName.split(':');

  return parts[parts.length - 1];
}

const getValue = (valueField: any): any => {
  switch (valueField.kind) {
    case 'OperationDefinition': return { [valueField.operation.charAt(0).toUpperCase() + valueField.operation.slice(1)]: Object.assign({}, ...getValue(valueField.selectionSet)) };
    case 'IntValue': return valueField.value
    case 'FloatValue': return valueField.value
    case 'StringValue': return valueField.value
    case 'Field': {
      const selectionSetValue = valueField.selectionSet && Object.keys(valueField.selectionSet).length && getValue(valueField.selectionSet);
      const argumentsValue = valueField.arguments && valueField.arguments.map(getValue);

      return { [getOperationName(valueField)]: {
        arguments: Object.assign({}, ...(argumentsValue || [])),
        selectionSet: Object.assign({}, ...(selectionSetValue || [])),
      } }
    }
    case 'SelectionSet':
      return valueField.selections.map(getValue);
    case 'Argument':
      return { [getName(valueField.name)]: getValue(valueField.value) }
    case 'ObjectValue':
      return Object.assign({}, ...valueField.fields.map(getValue))
    case 'ObjectField':
      return { [getName(valueField.name)]: getValue(valueField.value) }
    default: return Object.assign({}, ...valueField.fieldNodes.map(getValue));
  }
}

const getValidators = (operationPart: any, schemaPart: any, validators: any[] = [], operationArgs: any): any => {

  return flattenDeep(Object.keys(operationPart).map(key => {
    const rawKey = extractOperationName(key.replace(/!/gim, ''));
    const schemaShape = schemaPart[rawKey];
    const operationShape = operationPart[key] || operationPart[rawKey];
    const shapeType = isArray(schemaShape) && 'array' || typeof schemaShape;
    switch(shapeType) {
      case 'string': {
        const rawSchemaShape = schemaShape.replace(/!/gim, '')
        const isRequired = schemaShape.indexOf('!') > 0;
        const isScalar = schemaShape === 'Scalar';
        const schemaType = schema[rawSchemaShape];
        const validator: Function | undefined = inputTypesValidators[rawSchemaShape]
        const shapeValidators = validator && [...validators, validator(operationShape, operationArgs)] || validators;

        if (isRequired) shapeValidators.push(defaultValidators.required(operationShape, operationArgs))

        return isScalar ? validators : schemaType && getValidators(operationShape, schemaType, shapeValidators, operationArgs) || shapeValidators
      }
      case 'object': {
        const validator: Function | undefined = inputTypesValidators[rawKey];
        
        const shapeValidators = validator && [...validators, validator(operationShape, operationArgs)] || validators;

        return getValidators(operationShape, schemaShape, shapeValidators, operationArgs)
      }
    }
  })).filter(validator => validator);
}

const validateArguments = (parent: any, args: any, context: any, info: any) => {
  const operations = getValue(info.operation);
  let schema = transformSchema(info.schema);

  const validators = getValidators(operations, schema, [], { parent, args, context });
  console.log(validators.map((validator: any) => validator()));

}

export const resolvers = {
  Mutation: {
    // @ts-ignore
    createTransaction: async (resolve, parent, args: TransactionCreateArgs, context: Context, info) => {
      const result = await resolve(parent, args, context, info);
      console.time('val');
      validateArguments(parent, args, context, info)
      console.timeEnd('val');
      // @ts-ignore
      const accountId = args.data.account.connect.id;
      const account = await context.photon.accounts.findOne({ where: { id: accountId }, select: { id: true, balance: true } });

      if (!account) return result;

      const balance = account.balance + args.data.amount;

      await context.photon.accounts.update({
        where: { id: account.id },
        data: { balance },
      });

      return result;
    },
  },
};
