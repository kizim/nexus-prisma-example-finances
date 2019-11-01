import { Context } from "../context";
import { TransactionCreateInput, Transaction, TransactionCreateArgs } from "@generated/photon";
import { isArray, flattenDeep } from 'lodash';

const some = (results: any[]) => {
  const filtered = results.filter(result => result);
  if (filtered.length) {
    const stringErrors = filtered.filter(result => result !== true);
    const booleanResults = filtered.filter(result => result === true);
    if (booleanResults.length) return true;

    return stringErrors[0];
  }

  return false;
}

const every = (results: any[]) => {
  const filtered = results.filter(result => result);

  if (filtered.length === results.length) {
    const stringErrors = filtered.filter(result => result !== true);
    if (stringErrors.length) return stringErrors[0];

    return true;
  }

  return false
}
// const OR = (...fns: Function[]) => (...args: any) => () => {
//   console.log(fns);

//   return ({ result: some(fns.map(fn => fn(...flattenDeep(args)))), path: flattenDeep(args)[2] })
// };
// const AND = (...fns: Function[]) => (...args: any) => () => ({ result: fns.every(fn => fn(...flattenDeep(args))), path: flattenDeep(args)[2] });

// const rule = (fn: Function) => (...args: any[]) => () => {

//   return fn(...args)
// }

const AND = (...fns: Function[]) => (...args: any) => every(fns.map(fn => fn(...args)));
const OR = (...fns: Function[]) => (...args: any) => some(fns.map(fn => fn(...args)));

const rule = (fn: Function) => (...args: any[]) => () => ({ result: fn(...args), path: args[2] });

const inputTypesValidators: any = {
  UserWhereUniqueInput: rule(
    AND(
      OR((inputValue: any, args: any, operationName: string) => { 
        return args.context.user.id === inputValue.id ? true : 'Access denied';
      }, OR(() => false)),
      () => true,  
    )
  )
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
    return Object.assign({}, ...Object.keys(fields).map(key => transformType(fields[key])))
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
    case 'IntValue': return parseInt(valueField.value)
    case 'FloatValue': return parseFloat(valueField.value)
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

const getValidators = (operationPart: any, schemaPart: any, validators: any[], operationArgs: any, operations: string[] = []): any => {
  return flattenDeep(Object.keys(operationPart).map(key => {
    const rawKey = extractOperationName(key.replace(/!/gim, ''));
    const schemaShape = schemaPart[rawKey];
    const operationShape = operationPart[key] || operationPart[rawKey];
    const shapeType = isArray(schemaShape) && 'array' || typeof schemaShape;
    
    switch(shapeType) {
      case 'string': {
        const rawSchemaShape = schemaShape.replace(/!/gim, '')
        const isScalar = schemaShape === 'Scalar';
        const schemaType = operationArgs.schema[rawSchemaShape];
        const validator: Function | undefined = inputTypesValidators[rawSchemaShape]
        const shapeValidators = validator && [...validators, validator(operationShape, operationArgs, operations)] || validators;
        console.log([...operations, schemaShape])
        return isScalar ? validators : schemaType && validators.concat(getValidators(operationShape, schemaType, shapeValidators, operationArgs, [...operations, schemaShape])) || shapeValidators
      }
      case 'object': {
        const validator: Function | undefined = inputTypesValidators[rawKey];
        
        const shapeValidators = validator && [...validators, validator(operationShape, operationArgs, operations)] || validators;

        return getValidators(operationShape, schemaShape, shapeValidators, operationArgs, [...operations, rawKey])
      }
      default: {

        return validators;
      }
    }
  })).filter(validator => validator);
}

const validateArguments = ({ parent, args, context, info }: any, throwError = false) => {
const operations = getValue(info.operation);
  const schema = transformSchema(info.schema);
  // console.log(schema.UserWhereUniqueInput);
  const validators = getValidators(operations, schema, [], { schema, parent, args, context });
  // console.log(validators.map((validator: any) => validator()))
  const executedValidators = validators.map((validator: any) => validator()).filter(({ result }: any) => result !== true);
  console.log(executedValidators)
  if (!executedValidators.length) return true;

  const firstError: any = executedValidators[0];
    console.log(firstError)
  let validationResult;

  switch(typeof firstError.result) {
    case 'boolean': validationResult = throwError && new Error(`Validation failed | at ${firstError.path.join('.')}`) || firstError;
    case 'string': validationResult = throwError &&  new Error(`${firstError.result} | at ${firstError.path.join('.')}`) || firstError;
  }
  console.log(firstError.result)
  if (throwError) throw validationResult;

  return validationResult;
}

export const resolvers = {
  Mutation: {
    createAccount: (resolve, parent, args, context, info) => {
      console.time('val');
      validateArguments({ parent, args, context, info }, true);
      console.timeEnd('val');
      const result = resolve(parent, args, context, info);
      return result
    },
    // @ts-ignore
    createTransaction: async (resolve, parent, args: TransactionCreateArgs, context: Context, info) => {
      const result = await resolve(parent, args, context, info);
      console.time('val');
      // validateArguments(parent, args, context, info)
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
