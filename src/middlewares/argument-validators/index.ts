import { flattenDeep, isArray } from 'lodash';

import { some, every } from './matchers';
import { InputTypeValidators } from './types';

export const AND = (...fns: Function[]) => (...args: any) => every(fns.map(fn => fn(...args)));
export const OR = (...fns: Function[]) => (...args: any) => some(fns.map(fn => fn(...args)));

export const rule = (fn: Function) => (...args: any[]) => () => ({ result: fn(...args), path: args[2] });

export class ArgumentValidator {
  static systemTypes = ['Mutation', 'Query'];
  inputTypesValidators: any = {}
  throwErrors: boolean = false;

  // constructor(inputTypesValidators)

  static transformType(type: any, systemField = false): any {
    if (ArgumentValidator.systemTypes.includes(type.name)) {
      const fields = type._fields;
      return Object.assign({}, ...Object.keys(fields).map((key) => ArgumentValidator.transformType(fields[key], true)));
    }
  
    if (systemField) {
      return {
        [type.name]: {
          arguments: type.args && Object.assign({}, ...type.args.map(ArgumentValidator.transformType)) || {}
        }
      }
    }
    if (type.type) {

      return { [type.name]: type.type.toString() };
    }
  
    const fields = type._fields
    if (fields) {
      return Object.assign({}, ...Object.keys(fields).map(key => ArgumentValidator.transformType(fields[key])))
    }
  
    return 'Scalar';
  }
  
  static transformSchema (schema: any) {
    return Object.keys(schema._typeMap).reduce((r, key) => {
      const type = schema._typeMap[key];
      
      if (/^_+/gim.test(key)) {
        return r;
      } else {
        return { ...r, [key]: ArgumentValidator.transformType(type) };
      }

    }, {})
  }

  static getName = (nameField: any) => nameField.kind === 'Name' && nameField.value || nameField;


  static getOperationName(valueField: any) {
    const alias = valueField.alias && ArgumentValidator.getName(valueField.alias);
    const name = valueField.name && ArgumentValidator.getName(valueField.name);

    return alias && `${alias}:${name}` || name;
  }

  static extractOperationName = (operationName: string) => {
    const parts = operationName.split(':');
  
    return parts[parts.length - 1];
  }

  static getValue = (valueField: any): any => {
    switch (valueField.kind) {
      case 'OperationDefinition': return { [valueField.operation.charAt(0).toUpperCase() + valueField.operation.slice(1)]: Object.assign({}, ...ArgumentValidator.getValue(valueField.selectionSet)) };
      case 'IntValue': return parseInt(valueField.value)
      case 'FloatValue': return parseFloat(valueField.value)
      case 'StringValue': return valueField.value
      case 'Field': {
        const selectionSetValue = valueField.selectionSet && Object.keys(valueField.selectionSet).length && ArgumentValidator.getValue(valueField.selectionSet);
        const argumentsValue = valueField.arguments && valueField.arguments.map(ArgumentValidator.getValue);

        return { [ArgumentValidator.getOperationName(valueField)]: {
          arguments: Object.assign({}, ...(argumentsValue || [])),
          selectionSet: Object.assign({}, ...(selectionSetValue || [])),
        } }
      }
      case 'SelectionSet':
        return valueField.selections.map(ArgumentValidator.getValue);
      case 'Argument':
        return { [ArgumentValidator.getName(valueField.name)]: ArgumentValidator.getValue(valueField.value) }
      case 'ObjectValue':
        return Object.assign({}, ...valueField.fields.map(ArgumentValidator.getValue))
      case 'ObjectField':
        return { [ArgumentValidator.getName(valueField.name)]: ArgumentValidator.getValue(valueField.value) }
      default: return Object.assign({}, ...valueField.fieldNodes.map(ArgumentValidator.getValue));
      }
  }
  getValidators = (operationPart: any, schemaPart: any, validators: any[], operationArgs: any, operations: string[] = []): any => {
    return flattenDeep(Object.keys(operationPart).map(key => {
      const rawKey = ArgumentValidator.extractOperationName(key.replace(/!/gim, ''));
      const schemaShape = schemaPart[rawKey];
      const operationShape = operationPart[key] || operationPart[rawKey];
      const shapeType = isArray(schemaShape) && 'array' || typeof schemaShape;
      
      switch(shapeType) {
        case 'string': {
          const rawSchemaShape = schemaShape.replace(/!/gim, '')
          const isScalar = schemaShape === 'Scalar';
          const schemaType = operationArgs.schema[rawSchemaShape];
          const validator: Function | undefined = this.inputTypesValidators[rawSchemaShape]
          const shapeValidators = validator && [...validators, validator(operationShape, operationArgs, operations)] || validators;

          return isScalar ? validators : schemaType && validators.concat(this.getValidators(operationShape, schemaType, shapeValidators, operationArgs, [...operations, schemaShape])) || shapeValidators
        }
        case 'object': {
          const validator: Function | undefined = this.inputTypesValidators[rawKey];
          
          const shapeValidators = validator && [...validators, validator(operationShape, operationArgs, operations)] || validators;
  
          return this.getValidators(operationShape, schemaShape, shapeValidators, operationArgs, [...operations, rawKey])
        }
        default: {
  
          return validators;
        }
      }
    })).filter(validator => validator);
  }
  validateArguments = ({ parent, args, context, info }: any, throwError = false) => {
    const operations = ArgumentValidator.getValue(info.operation);
      const schema = ArgumentValidator.transformSchema(info.schema);

      const validators = this.getValidators(operations, schema, [], { schema, parent, args, context });
      const executedValidators = validators.map((validator: any) => validator()).filter(({ result }: any) => result !== true);

      if (!executedValidators.length) return true;
    
      const firstError: any = executedValidators[0];

      let validationResult;
    
      switch(typeof firstError.result) {
        case 'boolean': validationResult = throwError && new Error(`Validation failed | at ${firstError.path.join('.')}`) || firstError;
        case 'string': validationResult = throwError &&  new Error(`${firstError.result} | at ${firstError.path.join('.')}`) || firstError;
      }
      console.log(firstError.result)
      if (throwError) throw validationResult;
    
      return validationResult;
    }
}
