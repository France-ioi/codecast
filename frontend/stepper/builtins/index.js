
import {delay} from './delay';
import {getchar} from './getchar';
import {gets} from './gets';
import {malloc, free} from './heap';
import {printf} from './printf';
import {putchar} from './putchar';
import {puts} from './puts';
import {scanf} from './scanf';

export default {
  __delay: delay,
  getchar: getchar,
  gets: gets,
  malloc: malloc,
  free: free,
  printf: printf,
  putchar: putchar,
  puts: puts,
  scanf: scanf
};
