import { HttpHeaders, HttpParams } from '@angular/common/http';

export interface HttpOptionsModel {
	headers: HttpHeaders;
	responseType?: 'json';
	params?: HttpParams;
	body?: any;
}

