import Cookies from 'universal-cookie';
import type { ServiceContext } from './types';

export function getBrowserServiceContext(): ServiceContext {
	return {
		cookies: new Cookies()
	};
}
