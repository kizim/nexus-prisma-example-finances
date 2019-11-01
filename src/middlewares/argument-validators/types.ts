import { NexusGenInputs, NexusGenInputNames} from 'nexus-typegen';

export type Result = string | boolean;

export interface ValidationResult {
  result: Result
  path: string[]
}

import { Context } from '../../context';
import { GraphQLResolveInfo, GraphQLSchema } from 'graphql';

export type InputTypeValidators = {
  [key in NexusGenInputNames]: ValidationRuleResolver<NexusGenInputs[key]>
};

export interface ValidationContext extends Context {
  schema: GraphQLSchema
}

export interface ValidationArguments {
  parent: String,
  args: any,
  context: ValidationContext, 
  info: GraphQLResolveInfo
}

export type ValidationRuleResolver<V> = (value: V) => ValidationResult;
