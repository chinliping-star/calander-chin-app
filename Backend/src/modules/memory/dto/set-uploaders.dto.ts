import { IsIn, IsOptional, IsArray, IsMongoId, ArrayMaxSize } from 'class-validator';

export class SetUploadersDto {
  @IsIn(['everyone', 'selected'])
  mode: 'everyone' | 'selected';

  @IsOptional() @IsArray() @ArrayMaxSize(100) @IsMongoId({ each: true })
  user_ids?: string[];
}
