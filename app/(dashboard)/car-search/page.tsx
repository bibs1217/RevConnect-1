'use client'
import { useState } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────
interface Listing {
id: string
itemId: string
title: string
price: number
location: string
photo: string | null
listing_url: string
listing_type: string
condition: string
seller: string
source: string
}

interface AiCar {
id: string
title: string
make: string
model: string
year: number
price: number
location: string
condition: string
mileage: number
description: string
seller: string
url: string
}

interface Filters {
make: string; model: string
yearMin: string; yearMax: string
priceMin: string; priceMax: string
mileageMax: string; zip: string; radius: string
}

interface SiteDef {
name: string
emoji: string
color: string
url: (f: Filters) => string
}

interface SiteCategory {
label: string
sites: SiteDef[]
}

// ── Colors ────────────────────────────────────────────────────────────────────
const BG = '#1B2A3E'
const CARD = '#152234'
const RED = '#CC0000'
const BLUE2 = '#2255EE'
const GOLD = '#FFD700'
const INPUT = '#0E1825'
const BORDER = '#2A3F5A'
const TEXT = '#E8EDF2'
const MUTED = '#7A9BBD'

// ── URL helpers ───────────────────────────────────────────────────────────────
function qp(pairs: [string, string | undefined][]): string {
return pairs
.filter(([, v]) => v && v.trim() !== '')
.map(([k, v]) => `${k}=${encodeURIComponent(v!.trim())}`)
.join('&')
}

function slug(s: string) { return s.toLowerCase().replace(/\s+/g, '-') }
function lower(s: string) { return s.toLowerCase() }

// ── External site definitions ─────────────────────────────────────────────────
const SITE_CATEGORIES: SiteCategory[] = [
{
label: '🛒 Major Marketplaces',
sites: [
{
name: 'CarGurus', emoji: '🔍', color: '#FF6600',
url: ({ make, model, yearMin, yearMax, priceMax, mileageMax, zip, radius }) => {
const parts = ['d2', 'listingType%3Dused']
if (make) parts.push(`make%3D${make}`)
if (model) parts.push(`model%3D${model}`)
if (yearMin) parts.push(`minYear%3D${yearMin}`)
if (yearMax) parts.push(`maxYear%3D${yearMax}`)
if (priceMax) parts.push(`maxPrice%3D${priceMax}`)
if (mileageMax) parts.push(`maxMileage%3D${mileageMax}`)
if (zip) { parts.push(`zip%3D${zip}`); parts.push(`distance%3D${radius}`) }
return `https://www.cargurus.com/Cars/new/nl#listing=${parts.join('%7C')}`
},
},
{
name: 'AutoTrader', emoji: '🚘', color: '#0066CC',
url: ({ make, model, yearMin, yearMax, priceMax, mileageMax, zip, radius }) => {
const base = make && model
? `https://www.autotrader.com/cars-for-sale/used-cars/${encodeURIComponent(lower(make))}/${encodeURIComponent(lower(model))}`
: 'https://www.autotrader.com/cars-for-sale/used-cars'
const q = qp([['startYear', yearMin], ['endYear', yearMax], ['maxPrice', priceMax], ['maxMileage', mileageMax], ['zip', zip], ['searchRadius', zip ? radius : undefined]])
return q ? `${base}?${q}` : base
},
},
{
name: 'Cars.com', emoji: '🚗�, color: '#00A651',
url: ({ make, model, yearMin, yearMax, priceMax, mileageMax, zip, radius }) => {
const parts: string[] = ['stock_type=used']
if (make) parts.push(`makes[]=${encodeURIComponent(lower(make))}`)
if (model) parts.push(`models[]=${encodeURIComponent(slug(`${make} ${model}`))}`)
if (yearMin) parts.push(`year_min=${yearMin}`)
if (yearMax) parts.push(`year_max=${yearMax}`)
if (priceMax) parts.push(`price_max=${priceMax}`)
if (mileageMax) parts.push(`mileage_max=${mileageMax}`)
if (zip) { parts.push(`zip=${zip}`); parts.push(`maximum_distance=${radius}`) }
return `https://www.cars.com/shopping/results/?${parts.join('&')}`
},
},
{
name: 'CarMax', emoji: '🏪', color: '#CC0000',
url: ({ make, model, yearMin, yearMax, priceMax, mileageMax, zip }) => {
const base = make && model
? `https://www.carmax.com/cars/${encodeURIComponent(lower(make))}/${encodeURIComponent(lower(model))}`
: 'https://www.carmax.com/cars'
const q = qp([['year-min', yearMin], ['year-max', yearMax], ['price-max', priceMax], ['miles-max', mileageMax], ['zip', zip]])
return q ? `${base}?${q}` : base
},
},
{
name: 'Carvana', emoji: '🏎️', color: '#00A884',
url: ({ make, model, yearMin, yearMax, priceMax, mileageMax, zip }) => {
const base = make && model
? `https://www.carvana.com/cars/${encodeURIComponent(slug(`${make} ${model}`.trim()))}`.replace(/%20/g, '-')
: 'https://www.carvana.com/cars'
const q = qp([['year-min', yearMin], ['year-max', yearMax], ['price-max', priceMax], ['maximum-mileage', mileageMax], ['zip', zip]])
return q ? `${base}?${q}` : base
},
},
{
name: 'Vroom', emoji: '⚡', color: '#003087',
url: ({ make, model, yearMin, yearMax, priceMax, mileageMax }) => {
const q = qp([['make', make], ['model', model], ['year_min', yearMin], ['year_max', yearMax], ['price_max', priceMax], ['miles_max', mileageMax]])
return `https://www.vroom.com/cars?${q}`
},
},
{
name: 'TrueCar', emoji: '✅', color: '#00A550',
url: ({ make, model, yearMin, yearMax, priceMin, priceMax, mileageMax, zip }) => {
const base = make && model
? `https://www.truecar.com/used-cars-for-sale/listings/${encodeURIComponent(lower(make))}/${encodeURIComponent(lower(model))}/`
: 'https://www.truecar.com/used-cars-for-sale/listings/'
const parts: string[] = []
if (yearMin && yearMax) parts.push(`year[]=${yearMin}..${yearMax}`)
else if (yearMin) parts.push(`year[]=${yearMin}..`)
else if (yearMax) parts.push(`year[]=..${yearMax}`)
if (priceMin && priceMax) parts.push(`price[]=${priceMin}..${priceMax}`)
else if (priceMax) parts.push(`price[]=0..${priceMax}`)
if (mileageMax) parts.push(`mileage[]=0..${mileageMax}`)
if (zip) parts.push(`location=${zip}`)
return parts.length ? `${base}?${parts.join('&')}` : base
},
},
{
name: 'Kelley Blue Book', emoji: '📖', color: '#005BAC',
url: ({ make, model, yearMin, yearMax, priceMax, mileageMax, zip }) => {
const base = make && model
? `https://www.kbb.com/cars-for-sale/used-cars/${encodeURIComponent(lower(make))}/${encodeURIComponent(lower(model))}/`
: 'https://www.kbb.com/cars-for-sale/used-cars/'
const q = qp([['zip', zip], ['mileage', mileageMax], ['maxPrice', priceMax], ['minYear', yearMin], ['maxYear', yearMax]])
return q ? `${base}?${q}` : base
},
},
{
name: 'Edmunds', emoji: '🏅', color: '#4A154B',
url: ({ make, model, yearMin, yearMax, priceMax, zip, radius }) => {
const base = make && model
? `https://www.edmunds.com/${encodeURIComponent(lower(make))}/${encodeURIComponent(lower(model))}/used/`
: 'https://www.edmunds.com/used-cars-for-sale/'
const q = qp([['zip', zip], ['radius', zip ? radius : undefined], ['price', priceMax], ['year_min', yearMin], ['year_max', yearMax]])
return q ? `${base}?${q}` : base
},
},
{
name: 'iSeeCars', emoji: '👁️', color: '#003366',
url: ({ make, model, yearMin, yearMax, priceMax, mileageMax, zip, radius }) => {
const base = make && model
? `https://www.iseecars.com/used-cars/used-${encodeURIComponent(slug(`${make} ${model}`))}-for-sale`
: 'https://www.iseecars.com/used-cars-for-sale'
const parts: string[] = []
if (yearMin) parts.push(`year_min=${yearMin}`)
if (yearMax) parts.push(`year_max=${yearMax}`)
if (priceMax) parts.push(`price_max=${priceMax}`)
if (mileageMax) parts.push(`mileage_max=${mileageMax}`)
if (zip) { parts.push(`zip=${zip}`); parts.push(`radius=${radius}`) }
return parts.length ? `${base}#${parts.join('&')}` : base
},
},
{
name: 'CarsDirect', emoji: '🎯', color: '#FF4500',
url: ({ make, model, yearMin, yearMax, priceMax, zip }) => {
const q = qp([['year_min', yearMin], ['year_max', yearMax], ['price_max', priceMax], ['zip', zip]])
const kw = [make, model].filter(Boolean).join('+')
return `https://www.carsdirect.com/used-cars/${encodeURIComponent(kw)}?${q}`
},
},
{
name: 'AutoList', emoji: '📋', color: '#1565C0',
url: ({ make, model, yearMin, yearMax, priceMax, mileageMax, zip, radius }) => {
const q = qp([['year_min', yearMin], ['year_max', yearMax], ['price_max', priceMax], ['mileage_max', mileageMax], ['zip', zip], ['radius', zip ? radius : undefined]])
const kw = encodeURIComponent(`${make} ${model}`.trim())
return `https://www.autolist.com/listings#query=${kw}&${q}`
},
},
{
name: 'OfferUp', emoji: '💬', color: '#00C853',
url: ({ make, model, zip }) => {
const q = qp([['q', [make, model].filter(Boolean).join(' ')], ['zip', zip]])
return `https://offerup.com/search/?${q}`
},
},
{
name: 'Facebook Marketplace', emoji: '👥', color: '#1877F2',
url: ({ make, model, yearMin, yearMax, priceMax, mileageMax, zip, radius }) => {
const kw = encodeURIComponent(`${make} ${model}`.trim())
const q = qp([['minYear', yearMin], ['maxYear', yearMax], ['maxPrice', priceMax], ['maxMileage', mileageMax], ['zip', zip], ['radius', zip ? radius : undefined]])
return `https://www.facebook.com/marketplace/vehicles?query=${kw}&${q}`
},
},
{
name: 'Craigslist', emoji: '📌', color: '#6B4C9A',
url: ({ make, model, yearMin, yearMax, mileageMax, priceMax }) => {
const q = qp([['auto_make_model', [make, model].filter(Boolean).join(' ')], ['min_auto_year', yearMin], ['max_auto_year', yearMax], ['max_auto_miles', mileageMax], ['max_price', priceMax]])
return `https://www.craigslist.org/search/cta?${q}`
},
},
{
name: 'AutoTempest', emoji: '🌪️', color: '#555555',
url: ({ make, model, yearMin, yearMax, priceMax, mileageMax, zip, radius }) => {
const q = qp([['make', make], ['model', model], ['zip', zip], ['radius', zip ? radius : undefined], ['minyear', yearMin], ['maxyear', yearMax], ['maxprice', priceMax], ['maxmiles', mileageMax]])
return `https://www.autotempest.com/results?${q}`
},
},
],
},
{
label: '🔨 Auctions',
sites: [
{
name: 'Copart', emoji: '⚙️', color: '#003087',
url: ({ make, model, yearMin, yearMax 'Ғ����6��7B����vg&VR�f�&��6V&6�r����R���FV���f��FW"�&���V�����rr����vg&��זV"r��V$֖����wF�זV"r��V$���Ґ�&WGW&��GG3���wwr�6�'B�6���fV��6�Tf��FW"��G�� �����������S�t��r�V�����	�Jrr�6���#�r443r��W&â����R���FV���V$֖���V$��}) => {
const q = qp([['SearchParameters.YearFrom', yearMin], ['SearchParameters.YearTo', yearMax], ['SearchParameters.Query', [make, model].filter(Boolean).join(' ')]])
return `https://www.iaai.com/Search?${q}`
},
},
{
name: 'Bring a Trailer', emoji: '🏁', color: '#1B7A3E%�ЁĀ����ml��������t��l������e���mt���啅�5��t��l������e���mt���啅�5��ut�)ɕ��ɸ�������輽��ܹ����ɽ��й�������ѥ������ɔ��ݹ���͕�ɍ�������)��)��)�)����耝Q��ф�
A<��������耟�~RМ�������耜�
������)�ɰ耡쁵����������Ʌ���́�������)����ЁĀ����ml������������t��l����х�����������Ʌ���̀�չ�������ut�)����Ё��􁵽������������UI%
�������С��ݕȡ��������耝����)ɕ��ɸ�������輽��ܹѽ�ф�����͕�ɍ����ٕ�ѽ�併���������������)��)��)�)����耝!�����
A<��������耟�~RМ�������耜�
������)�ɰ耡쁵����������������)����ЁĀ����ml��������t��l��������������ut�)ɕ��ɸ�������輽��ܹ�������������ѥ�������ٕ�ѽ��������)��)��)�)����耝9��ͅ��
A<��������耟�~RМ�������耜�
������)�ɰ耡����������������輽��ܹ���ͅ��̈́��������ѥ������ɔ��ݹ����ѵ��������������������耜����)��)�)����耝!�չ����
A<��������耟�~RԜ�������耜������ܜ�)�ɰ耡�����������)����ЁĀ����ml��������ut�)ɕ��ɸ�������輽��ܹ��չ����̈́������̽������ѥ������ɔ��ݹ��������)��)��)�)����耝-���
A<��������耟�~RМ�������耜�
������)�ɰ耡쁵����������������)����ЁĀ����ml��������t��l��������������ut�)ɕ��ɸ�������輽��ܹ���������̽�����ٕ�ѽ��ɕ�ձ�������)��)��)�)����耝MՉ��ԁ
A<��������耟�~RԜ�������耜������ܜ�)�ɰ耡�����������)����ЁĀ����ml��������ut�)ɕ��ɸ�������輽��ܹ�Չ��Թ����͡��������ե����ѵ�������)��)��)�)����耝5�鑄�
A<��������耟�~RМ�������耜�
������)�ɰ耡�����������)����ЁĀ����ml��������ut�)ɕ��ɸ�������輽��ܹ��鑅�̈́��������ѥ������ɔ��ݹ��������)��)��)�)����耝�����
A<��������耟�~RМ�������耜�
������)�ɰ耡�����������)����ЁĀ����ml��������ut�)ɕ��ɸ�������輽��ܹ�������������͡���������ٕ�ѽ�乡ѵ�������)��)��)�)����耝)����
A<��������耟�~~���������耜��������)�ɰ耡�����������)����ЁĀ����ml��������ut�)ɕ��ɸ�������輽��ܹ������������͡���������ٕ�ѽ�乡ѵ�������)��)��)�)����耝I���
A<��������耟�~RМ�������耜�
������)�ɰ耡�����������)����ЁĀ����ml��������ut�)ɕ��ɸ�������輽��ܹɅ���Ս�̹�������͡���������ٕ�ѽ�乡ѵ�������)��)��)�)����耝	5\�
A<��������耟�~RԜ�������耜������ܜ�)�ɰ耡�����������)����ЁĀ����ml��������ut�)ɕ��ɸ�������輽��ܹ����̈́��������ѥ��������ѕȵٕ�����̹�ѵ�������)��)��)�)����耝5�ɍ���́
A<��������耟��@��������耜������Ԝ�)�ɰ耡�����������)����ЁĀ����ml��������ut�)ɕ��ɸ�������輽��ܹ���̈́�����������������)��)��)�)����耝Ց��
A<��������耟�~R`��������耜������̜�)�ɰ耡�����������)����ЁĀ����ml��������ut�)ɕ��ɸ�������輽��ܹ�Ց��̈́������̽ݕ����������̽���ѥ������ɔ��ݹ����ѵ�������)��)��)�)����耝1���́
A<��������耟�~>߾�<��������耜������̜�)�ɰ耡�����������)����ЁĀ����ml��������ut�)ɕ��ɸ�������輽��ܹ����̹�������ѥ������ɔ��ݹ���������)��)��)�)����耝%�����Ѥ�
A<��������耟�f���<��������耜������Ȝ�)�ɰ耡�����������)����ЁĀ����ml��������ut�)ɕ��ɸ�������輽��ܹ������ѥ�̈́��������ѥ������ɔ��ݹ��������)��)��)�)����耝��Ʉ�
A<��������耟�~RМ�������耜��������)�ɰ耡�����������)����ЁĀ����ml��������ut�)ɕ��ɸ�������輽��ܹ���Ʉ��������ѥ������ɔ��ݹ��������)��)��)�)����耝Y��ټ�
A<��������耟�~RԜ�������耜������ܜ�)�ɰ耡�����������)����ЁĀ����ml��������ut�)ɕ��ɸ�������輽��ܹٽ�ٽ���̹��������̽���ѥ������ɔ��ݹ��������)��)��)�)����耝A��͍���
A<��������耟�~���������耜������)�ɰ耡�����������)����ЁĀ����ml��������ut�)ɕ��ɸ�������輽��ܹ���͍��������̈́�������х�н����������Ʌ�������������)��)��)t�)��)�)�����耟�~>�M�������䀘�
���ͥ���)ͥѕ��l)�)����耝!������̜�������耟�~>o��<��������耜�����̜�)�ɰ耡쁵������������啅�5����啅�5�ఁ�ɥ��5�ఁ����Ʌ���́�������)����Ё��͔�􁵅�����������(��������輽��ܹ�������̹��������ͥ����̽���̵��ȵͅ����핹����UI%
�������С��ݕȡ���������핹����UI%
�������С��ݕȡ���������(耝�����輽��ܹ�������̹��������ͥ����̽���̵��ȵͅ���)����ЁĀ����ml�啅�Ĝ��啅�5��t��l�啅�Ȝ��啅�5��t��l��ɥ��Ȝ���ɥ��5��t��l��������t��l����х�����������Ʌ���̀�չ�������ut�)ɕ��ɸ�Ā����퉅͕��������聉�͔)��)��)�)����耝
���ͥ�
��̹�����������耟�~jd��������耜��������)�ɰ耡쁵������������啅�5����啅�5�ఁ����������)����Ё��͔�􁵅�����������(��������輽����ͥ����̹�������ѥ��̽������핹����UI%
�������С��ݕȡ���������핹����UI%
�������С��ݕȡ���������(耝�����輽����ͥ����̹�������ѥ��̜)����ЁĀ����ml�g�V%�g&��r��V$֖����w�V%�F�r��V$�����w��r����Ґ�&WGW&��G�&6W��G���&6P�����������S�tWF����r�V�����	�H�r�6���#�r3cd42r��W&â����R���FV���V$֖���V$���&�6T�����Ғ����6��7B&6R���Rbb��FV����GG3���wwr�WF�����6���G�V�6�FUU$�6����V�B���vW"���R����G�V�6�FUU$�6����V�B���vW"���FV��� ��v�GG3���wwr�WF�����6���p�6��7B����w��r������v֖���V"r��V$֖����v����V"r��V$�����v���&�6Rr�&�6T���Ґ�&WGW&��G�&6W��G���&6P�����������S�t6$'&��r�V�����	�zr�6���#�r4dcccr��W&â����Ғ����6��7B����w��r����Ґ�&WGW&��GG3���6&'&���6����G�� �����������S�uVFF�Rr�V�����	�+r�6���#�r3SSr��W&â����Ғ����6��7B����w��r����Ґ�&WGW&��GG3���wwr�VFF�R�6����G�� ����������������&Vâ	���FV�W"�WGv�&�2r��6�FW3�������S�tWF��F���r�V�����	��"r�6���#�r33�rr��W&â����R���FV���V$֖���V$���&�6T������&F�W2Ғ����6��7B����v��Rr���U���v��FV�r���FV����w�V$֖�r��V$֖����w�V$��r��V$�����w&�6T��r�&�6T�����w��r������w&F�W2r����&F�W2�V�FVf��VE�Ґ�&WGW&��GG3���wwr�WF��F����6���W6VB�6'2�f�"�6�S�G�� �����������S�tG&�fUF��Rr�V�����	������r�6���#�r4dcccr��W&â����R���FV���V$֖���V$���&�6T�����Ғ����6��7B&6R���Rbb��FV����GG3���wwr�G&�fWF��R�6���6'2�G�V�6�FUU$�6����V�B���vW"���R����G�V�6�FUU$�6����V�B���vW"���FV�� ��v�GG3���wwr�G&�fWF��R�6���6'2p�6��7B����w��46�FRr������v���V"r��V$�����v֖�V"r��V$֖����v��&�6Rr�&�6T���Ґ�&WGW&��G�&6W��G���&6P�����������S�t�V�G&�6�6'2r�V�����	��r�6���#�r443r��W&â����R���FV���V$֖���V$���&�6T������&F�W2Ғ����6��7B����v��Rr���U���v��FV�r���FV����w�V%�֖�r��V$֖����w�V%���r��V$�����w&�6U���r�&�6T�����w��r������w&F�W2r����&F�W2�V�FVf��VE�Ґ�&WGW&��GG3���wwr�V�G&�6�6'2�6���W6VB֖�fV�F�'���G�� �������������Р���)H)H6����V�B)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H �W��'BFVfV�BgV�7F���6%6V&6�vR����6��7B�f��FW'2�6WDf��FW'5��W6U7FFS�f��FW'3⇰���S�rr���FVârr��V$֖�rr��V$���rr��&�6T֖�rr�&�6T���rr�֖�VvT���rr�����rr�&F�W3�s#Sr��Ґ�6��7B�Ɨ7F��w2�6WDƗ7F��w5��W6U7FFS�Ɨ7F��u��ⅵҐ�6��7B��Ɨ7F��w2�6WD�Ɨ7F��w5��W6U7FFS��6%��ⅵҐ�6��7B�F�F��6WEF�F���W6U7FFR���6��7B�F�F�vW2�6WEF�F�vW5��W6U7FFR���6��7B�vR�6WEvU��W6U7FFR���6��7B���F��r�6WD��F��u��W6U7FFR�f�6R��6��7B����F��r�6WD���F��u��W6U7FFR�f�6R��6��7B�6V&6�VB�6WE6V&6�VE��W6U7FFR�f�6R��6��7B�W'&�"�6WDW'&�%��W6U7FFR�rr��6��7B��W'&�"�6WD�W'&�%��W6U7FFR�rr��6��7B�vV���F��r�6WDvV���F��u��W6U7FFR�f�6R��6��7B��7Df��FW'2�6WD�7Df��FW'5��W6U7FFS�f��FW'2��V����V���gV�7F���6WDb����W��bf��FW'2�c�7G&��r���6WDf��FW'2�b�������b���ӢbҒ��Р�7��2gV�7F���fWF6��Ɨ7F��w2�c�f��FW'2���6WD���F��r�G'VR��6WD�W'&�"�rr��6��7B��WrU$�6V&6�&�2����b�b���R��6WB�v��Rr�b���R�G&�҂����b�b���FV�6WB�v��FV�r�b���FV��G&�҂����b�b�V$֖��6WB�w�V$֖�r�b�V$֖��&W�6R���B�r�rr����b�b�V$����6WB�w�V$��r�b�V$���&W�6R���B�r�rr����b�b�&�6T֖��6WB�w&�6T֖�r�b�&�6T֖��&W�6R���B�r�rr����b�b�&�6T����6WB�w&�6T��r�b�&�6T���&W�6R���B�r�rr����b�b禗��6WB�w��r�b禗�&W�6R���B�r�rr���G'���6��7B&W2�v�BfWF6�������6"�6V&6��G����6��7BFF�v�B&W2�6�ₐ�6WD�Ɨ7F��w2�FF�Ɨ7F��w2���Ґ��6F6���6WD�W'&�"�t�6V&6�V�f��&�Rr��6WD�Ɨ7F��w2��Ґ��f���ǒ��6WD���F��r�f�6R��ЧР�7��2gV�7F���'V�6V&6��vT�VӢ�V�&W"�f��FW'5F�W6S�f��FW'2���6��7Bb�f��FW'5F�W6R��f��FW'0�6WD��F��r�G'VR��6WEvR�vT�VҐ�6WDW'&�"�rr���6��7B��WrU$�6V&6�&�2����b�b���R��6WB�v��Rr�b���R�G&�҂����b�b���FV�6WB�v��FV�r�b���FV��G&�҂����b�b�V$֖��6WB�w�V$֖�r�b�V$֖��&W�6R���B�r�rr����b�b�V$����6WB�w�V$��r�b�V$���&W�6R���B�r�rr����b�b�&�6T֖��6WB�w&�6T֖�r�b�&�6T֖��&W�6R���B�r�rr����b�b�&�6T����6WB�w&�6T��r�b�&�6T���&W�6R���B�r�rr����b�b�֖�VvT����6WB�v֖�VvT��r�b�֖�VvT���&W�6R���B�r�rr���6��7B6�V妗�b禗�&W�6R���B�r�rr���b�6�V妗bbb�&F�W2��v�F���v�FRr���6WB�w��r�6�V妗���6WB�w&F�W2r�b�&F�W2�Ч�6WB�wvRr�7G&��r�vT�VҒ���G'���6��7B&W2�v�BfWF6�����6"�6V&6��G����66�S�v���7F�&RrҐ�6��7BFF�v�B&W2�6�ₐ��b�FF�W'&�"���6WDW'&�"�FF�W'&�"��6WDƗ7F��w2��Ґ��V�6R��6WDƗ7F��w2�FF�Ɨ7F��w2���Ґ�6WEF�FFF�F�F�����6WEF�F�vW2�FF�F�F�vW2����6WEvR�FF�vR��vT�VҐ�6WD�7Df��FW'2�����b����6�V妗Ґ�6WE6V&6�VB�G'VR��Ч�6F6���6WDW'&�"�u6V&6�f��VB��V6RG'�v���r���f���ǒ��6WD��F��r�f�6R��ЧР�gV�7F�����F�U6V&6��S�&V7B�f�&�WfV�B���R�&WfV�DFVfV�B���fWF6��Ɨ7F��w2�f��FW'2��'V�6V&6����Р�7��2gV�7F���W6Tה��6F��ₒ���b��f�vF�"�vV���6F���&WGW&�6WDvV���F��r�G'VR���f�vF�"�vV���6F����vWD7W'&V�E�6�F���7��2�2����G'���6��7B&W2�v�BfWF6���GG3�����&�vFF6��VB��WB�FF�&WfW'6R�vV�6�FR�6ƖV�C��F�GVFS�G��2�6��&G2��F�GVFW�f���v�GVFS�G��2�6��&G2����v�GVFW�f��6ƗG���wVvS�V���6��7BFF�v�B&W2�6�ₐ��b�FF��7F6�FR�6WDb�w��r�FF��7F6�FR���6F6����v��&R��Цf���ǒ�6WDvV���F��r�f�6R�Ч������6WDvV���F��r�f�6R���Р�6��7B���F�ǒ��&�6S��V�&W"���&�6R�BG��F��&�V�B�&�6R�c��R��F���6�U7G&��r�������rp��6��7B���&V7B�555&�W'F�W2���&6�w&�V�C���UB�&�&FW#��6�ƖBG�$�$DU'��&�&FW%&F�W3�b��6���#�DU�B�FF��s�s���r�f��E6��S�2�v�GF��sRr�&��6����s�v&�&FW"�&��r��Ц6��7B�&â&V7B�555&�W'F�W2���6���#��UDTB�f��E6��S���&v��&�GF�ӢB�F�7���v&��6�r��FW�EG&�6f�&ӢwWW&66Rr��WGFW%76��s���Р���'V��BW�FW&��6�FRƖ�2g&���7B6V&6�VBf��FW'0�6��7B6�FTf��FW'3�f��FW'2��7Df��FW'2������S�f��FW'2���R���FVâf��FW'2���FV����V$֖�f��FW'2�V$֖��&W�6R���B�r�rr����V$���f��FW'2�V$���&W�6R���B�r�rr���&�6T֖�f��FW'2�&�6T֖��&W�6R���B�r�rr���&�6T���f��FW'2�&�6T���&W�6R���B�r�rr���֖�VvT���f��FW'2�֖�VvT���&W�6R���B�r�rr������f��FW'2禗�&W�6R���B�r�rr���&F�W3�f��FW'2�&F�W2��Р�&WGW&����F�b7G��S׷�֖�V�v�C�sf�r�&6�w&�V�C�$r�6���#�DU�B�f��Df֖Ǔ�w7�7FV��V��6�2�6W&�br��ࠧ��)H)H�VFW")H)H��У�F�b7G��S׷�&6�w&�V�C�r3S�#Rr�&�&FW$&�GF�Ӣ�6�ƖBG�$�$DU'��FF��s�sG�#G�r���ƃ7G��S׷��&v���f��E6��S�#"�f��EvV�v�C�s����7�6�74��S�''v##�f�7F�'���7���7�6�74��S�''v#"#�&Wc��7���7�6�74��S�''v#2#�6���V7C��7��6"6V&6�������F�b7G��S׷�6���#��UDTB�f��E6��S�"��&v��F��2���ƗfRƗ7F��w2g&��T&���F�'2+r���vW&VB&W7V�G2+rF�&V7BƖ�2F�S�6"6�FW0���F�c���F�cࠣ�F�b7G��S׷���v�GF��3��&v��sWF�r�FF��s�s#�g�r��ࠧ��)H)H6V&6�f�&�)H)H��У�f�&���7V&֗C׶��F�U6V&6����F�b7G��S׷�&6�w&�V�C�4$B�&�&FW%&F�W3�"�FF��s�sg���r��&v��&�GF�Ӣb����F�b7G��S׷�F�7���vw&�Br�w&�EFV��FT6��V��3�w&WVB�WF��f����֖����C��g"��r�v�"��&v��&�GF�Ӣ"����F�c���&V�7G��S׶�&�����S���&V��Ɩ�WBf�VS׶f��FW'2���W���6��vS׶R��6WDb�v��Rr�R�F&vWB�f�VR�Ч�6V���FW#�$f�&B"7G��S׶�������F�c��F�c���&V�7G��S׶�&�����FV����&V��Ɩ�WBf�VS׶f��FW'2���FV����6��vS׶R��6WDb�v��FV�r�R�F&vWB�f�VR�Ч�6V���FW#�$�W7F�r"7G��S׶�������F�c��F�c���&V�7G��S׶�&���V"֖����&V��Ɩ�WBf�VS׶f��FW'2�V$֖����6��vS׶R��6WDb�w�V$֖�r�R�F&vWB�f�VR�Ч�6V���FW#�##"7G��S׶�������F�c��F�c���&V�7G��S׶�&���V"�����&V��Ɩ�WBf�VS׶f��FW'2�V$�����6��vS׶R��6WDb�w�V$��r�R�F&vWB�f�VR�Ч�6V���FW#�###B"7G��S׶�������F�c��F�c���&V�7G��S׶�&���&�6R֖����&V��Ɩ�WBf�VS׶f��FW'2�&�6T֖����6��vS׶R��6WDb�w&�6T֖�r�R�F&vWB�f�VR�Ч�6V���FW#�#S"7G��S׶�������F�c��F�c���&V�7G��S׶�&���&�6R�����&V��Ɩ�WBf�VS׶f��FW'2�&�6T�����6��vS׶R��6WDb�w&�6T��r�R�F&vWB�f�VR�Ч�6V���FW#�#3"7G��S׶�������F�c��F�c���&V�7G��S׶�&�����֖�W3���&V��Ɩ�WBf�VS׶f��FW'2�֖�VvT�����6��vS׶R��6WDb�v֖�VvT��r�R�F&vWB�f�VR�Ч�6V���FW#�#�"7G��S׶�������F�c��F�c���&V�7G��S׶�&��夕6�FS���&V���F�b7G��S׷�F�7���vf�W�r�v�R���Ɩ�WBf�VS׶f��FW'2禗���6��vS׶R��6WDb�w��r�R�F&vWB�f�VR�Ч�6V���FW#�#3Cc��"���V�wF�׳W�7G��S׷������f�W�������'WGF��G�S�&'WGF��"��6Ɩ6�׷W6Tה��6F����F�6&�VC׶vV���F��wЧ7G��S׷�&6�w&�V�C���UB�&�&FW#��6�ƖBG�$�$DU'��6���#��UDTB�&�&FW%&F�W3�b�FF��s�s��r�7W'6�#�w���FW"r�f��E6��S�B�f�W�6�&�波��৶vV���F��r�~(
br�	�8�wУ��'WGF�����F�c���F�c��F�c���&V�7G��S׶�&���&F�W3���&V���6V�V7Bf�VS׶f��FW'2�&F�W7���6��vS׶R��6WDb�w&F�W2r�R�F&vWB�f�VR��7G��S׶��2&V7B�555&�W'F�W7����F���f�VS�&�F���v�FR#��F���v�FS���F���৵�sSr�sr�sSr�s#Sr�sSu����"����F����W�׷'�f�VS׷'��'�֓���F����У��6V�V7C���F�c���F�c��F�b7G��S׷�FW�DƖv�w&�v�Br����'WGF��G�S�'7V&֗B"F�6&�VC׶��F��r�����F��wЧ7G��S׷�&6�w&�V�C����F��r�����F��r��$�$DU"�$TB�6���#�r6ffbr�&�&FW#�v���Rr�&�&FW%&F�W3���FF��s�s�3g�r�f��E6��S�R�f��EvV�v�C�s�7W'6�#����F��r�����F��r��v��B����vVBr�w���FW"r��৲���F��r�����F��r��u6V&6���~(
br�	�H�6V&6�6'2wУ��'WGF�����F�c���F�c���f�&�ࠧ�W'&�"bb���F�b7G��S׷�&6�w&�V�C�r34r�&�&FW#��6�ƖBG�$TG��&�&FW%&F�W3���FF��s�s'�g�r��&v��&�GF�Ӣb�6���#�r4dc��r�f��E6��S�B��৶W'&�'У��F�cࢗР���)H)H���vW&VBƗ7F��w2)H)H��Ч�����F��r���6V&6�VBbb�Ɨ7F��w2��V�wF������W'&�"�bb���F�b7G��S׷��&v��&�GF�Ӣ#�����F�b7G��S׷�F�7���vf�W�r�Ɩv�FV�3�v6V�FW"r�v���&v��&�GF�ӢB����7�7G��S׷�f��E6��S�����	�Ic��7���7�7G��S׷�f��E6��S�r�f��EvV�v�C�s������vW&VBƗ7F��w3��7���7�7G��S׷�&6�w&�V�C�w&v&�#SR�#R���"�r�&�&FW#��6�ƖBG�t��G�CF�6���#�t��B�f��E6��S��FF��s�s'��r�&�&FW%&F�W3�#�f��EvV�v�C�s����tT�@���7�৶���F��rbb�7�7G��S׷�6���#��UDTB�f��E6��S�2���vV�W&F��rW'6��Ɨ�VB&W7V�G>(
c��7��У��F�cࠧ����F��rbb���F�b7G��S׷�&6�w&�V�C�4$B�&�&FW%&F�W3��FF��s�s3'�r�FW�DƖv�v6V�FW"r�&�&FW#��6�ƖBG�$�$DU'�����F�b7G��S׷�f��E6��S�#���&v��&�GF�Ӣ����)�������F�c��F�b7G��S׷�6���#��UDTB�f��E6��S�B����vV�B�26V&6���rf�"�F6���rfV��6�W>(
c��F�c���F�cࢗР���W'&�"bb���F��rbb���F�b7G��S׷�&6�w&�V�C�r34r�&�&FW#��6�ƖBG�$TG��&�&FW%&F�W3���FF��s�s�G�r�6���#�r4dc��r�f��E6��S�2��৶�W'&�'У��F�cࢗР�����F��rbb�Ɨ7F��w2��V�wF��bb���F�b7G��S׷�F�7���vw&�Br�w&�EFV��FT6��V��3�w&WVB�WF��f����֖����#s��g"��r�v�B��৶�Ɨ7F��w2���6"�����F�b�W�׶6"�GЧ7G��S׷�&6�w&�V�C�4$B�&�&FW%&F�W3���fW&f��s�v��FFV�r�&�&FW#��6�ƖB4ddCs36�F�7���vf�W�r�f�W�F�&V7F���v6��V��r��৲��&FvR�VFW"��У�F�b7G��S׷�&6�w&�V�C�w&v&�#SR�#R�����r�&�&FW$&�GF�Ӣ�6�ƖB4ddCs#&�FF��s�sg�'�r�F�7���vf�W�r�Ɩv�FV�3�v6V�FW"r�v�b����7�7G��S׷�f��E6��S��f��EvV�v�C�s�6���#�t��B���	�Ib��D4�TC��7���7�7G��S׷�f��E6��S��6���#��UDTB��&v���VgC�vWF�r���6"�6��F�F������7����F�c৲��6V���FW"��F�&V��У�F�b7G��S׷��V�v�C�C�&6�w&�V�C�Ɩ�V"�w&F�V�B�3VFVr�3S�#RR�3#$4RR��F�7���vf�W�r�Ɩv�FV�3�v6V�FW"r��W7F�g�6��FV�C�v6V�FW"r��6�F���w&V�F�fRr����7�7G��S׷�f��E6��S�C����	��s��7���7�7G��S׷��6�F���v'6��WFRr�&�GF�Ӣ��&�v�C��f��E6��S��6���#��UDTB��৶6"�V'�+r�6"�֖�VvR�6"�֖�VvR�F���6�U7G&��r���r֒r�t֖�W2��wУ��7����F�c৲���f���У�F�b7G��S׷�FF��s�s�7�r�f�W���F�7���vf�W�r�f�W�F�&V7F���v6��V��r�v�b����F�b7G��S׷�f��EvV�v�C�s�f��E6��S�B�6���#�DU�B�Ɩ�T�V�v�C��2���6"�F�F�W���F�c��F�b7G��S׷�F�7���vf�W�r�Ɩv�FV�3�v&6VƖ�Rr�v������7�7G��S׷�f��E6��S�#"�f��EvV�v�C���6���#�t��B��৶6"�&�6R��BG�6"�&�6R�F���6�U7G&��r����t6��f�"&�6RwУ��7�৶6"�&�6R�bb�7�7G��S׷�6���#��UDTB�f��E6��S�"������F�ǒ�6"�&�6R����7��У��F�c��F�b7G��S׷�f��E6��S�"�6���#�DU�B��6�G���r�Ɩ�T�V�v�C��B���6"�FW67&�F������F�c��F�b7G��S׷�F�7���vf�W�r�v�"�f��E6��S�"�6���#��UDTB�f�W�w&�ww&r��৶6"���6F���bb�7��	�8��6"���6F������7��Ч�6"�6V��W"bb�7��	����6"�6V��W'���7��У��F�c��F�b7G��S׷��&v��F��vWF�r�FF��uF��������&Vc׶6"�W&��F&vWC�%�&��"&V��&���V�W"��&VfW'&W" �7G��S׷�F�7���v&��6�r�&6�w&�V�C�Ɩ�V"�w&F�V�B�3VFVr�G�t��G��4Sd#���6���#�r3r�FF��s�s��r�&�&FW%&F�W3�b�FW�DƖv�v6V�FW"r�FW�DFV6�&F���v���Rr�f��E6��S�2�f��EvV�v�C�s���f�WrƗ7F��r(ip������F�c���F�c���F�c࢒�У��F�cࢗУ��F�cࢗР���)H)HT&�&W7V�G2)H)H��Ч���F��rbb���F�b7G��S׷�FW�DƖv�v6V�FW"r�FF��s�sC��r�6���#��UDTB����F�b7G��S׷�f��E6��S�3b��&v��&�GF�Ӣ���(�3��F�c��F�b7G��S׷�f��E6��S�b���6V&6���rT&���F�'>(
c��F�c���F�cࢗР��6V&6�VBbb��F��rbb���F�b7G��S׷��&v��&�GF�Ӣ#���৲�7FGW2&"��У�F�b7G��S׷�F�7���vf�W�r�Ɩv�FV�3�v6V�FW"r�v�"�f�W�w&�ww&r��&v��&�GF�ӢB����7�7G��S׷�f��E6��S�r�f��EvV�v�C�s���Ɨ7F��w2��V�wF��F���6�U7G&��r���T&�&W7V�G3��7���7�7G��S׷�6���#��UDTB�f��E6��S�2��৷F�F��F���6�U7G&��r���F�F�+rvR�vW��b�F�F�vW7У��7���7�7G��S׷�&6�w&�V�C�r34r�6���#�r4dc��r�f��E6��S��FF��s�s'��r�&�&FW%&F�W3�#�f��EvV�v�C�s���T&���F�'0���7����F�cࠧ��6&G2��Ч�Ɨ7F��w2��V�wF��������F�b7G��S׷�FW�DƖv�v6V�FW"r�FF��s�sC�r�6���#��UDTB�&6�w&�V�C�4$B�&�&FW%&F�W3���&v��&�GF�Ӣb����F�b7G��S׷�f��E6��S�3"��&v��&�GF�Ӣ����	�H���F�c��F�b7G��S׷�f��E6��S�b�6���#�DU�B��&v��&�GF�Ӣb�����T&�Ɨ7F��w2f�V�C��F�c��F�b7G��S׷�f��E6��S�2���G'�F�W7F��r��W"f��FW'2�W6RF�R6�FR'WGF��2&V��rF�6V&6�V�6Wv�W&R���F�c���F�c࢒����F�b7G��S׷�F�7���vw&�Br�w&�EFV��FT6��V��3�w&WVB�WF��f����֖����#s��g"��r�v�B��&v��&�GF�Ӣ���৶Ɨ7F��w2���������F�b�W�׶��GЧ7G��S׷�&6�w&�V�C�4$B�&�&FW%&F�W3���fW&f��s�v��FFV�r�&�&FW#��6�ƖBG�$�$DU'��F�7���vf�W�r�f�W�F�&V7F���v6��V��r��৲���F���У�F�b7G��S׷��6�F���w&V�F�fRr��V�v�C�sR�&6�w&�V�C���UB�f�W�6�&�波��৶����F����Ɩ�r7&3׶����F���C׶��F�F�WЧ7G��S׷�v�GF��sRr��V�v�C�sRr��&�V7Df�C�v6�fW"r�Ц��W'&�#׶R����R�F&vWB2�D�Ė�vTV�V�V�B��7G��R�F�7���v���Rr���࢒����F�b7G��S׷�v�GF��sRr��V�v�C�sRr�F�7���vf�W�r�Ɩv�FV�3�v6V�FW"r��W7F�g�6��FV�C�v6V�FW"r�6���#��UDTB�f��E6��S�C���	��s��F�cࢗЧ��T&�&FvR��У�7�7G��S׷��6�F���v'6��WFRr�F�����VgC���&6�w&�V�C�r4SC33rr�6���#�r6ffbr�f��E6��S��f��EvV�v�C�s�FF��s�s'���r�&�&FW%&F�W3�B���T&����Ɨ7F��u�G�R���tV7F���r�rT5D���r�rwУ��7����F�cࠧ����f���У�F�b7G��S׷�FF��s�s�7�r�f�W���F�7���vf�W�r�f�W�F�&V7F���v6��V��r�v�R����F�b7G��S׷�f��EvV�v�C�c�f��E6��S�2�6���#�DU�B�Ɩ�T�V�v�C��3R��fW&f��s�v��FFV�r�F�7���r�vV&��B�&��r�vV&��DƖ�T6���"�vV&��D&���&�V�C�wfW'F�6�r��৶��F�F�WУ��F�cࠣ�F�b7G��S׷�F�7���vf�W�r�Ɩv�FV�3�v&6VƖ�Rr�v������7�7G��S׷�f��E6��S�#�f��EvV�v�C�s�6���#���&�6R��t��B��UDTB��৶��&�6R��BG���&�6R�F���6�U7G&��r����u6VRƗ7F��rwУ��7�৶��&�6R�bb�7�7G��S׷�6���#��UDTB�f��E6��S�"������F�ǒ���&�6R����7��У��F�cࠧ���6��F�F���bb���F�b7G��S׷�f��E6��S�"�6���#��UDTB�����6��F�F������F�cࢗР��F�b7G��S׷�F�7���vf�W�r�v��f��E6��S�"�6���#��UDTB�f�W�w&�ww&r��৶����6F���bb�7��	�8������6F������7��Ч���6V��W"bb�7��	�B���6V��W'���7��У��F�cࠣ�F�b7G��S׷��&v��F��vWF�r�FF��uF��������&Vc׶��Ɨ7F��u�W&��F&vWC�%�&��"&V��&���V�W"��&VfW'&W" �7G��S׷�F�7���v&��6�r�&6�w&�V�C�r4SC33rr�6���#�r6ffbr�FF��s�sw�r�&�&FW%&F�W3�b�FW�DƖv�v6V�FW"r�FW�DFV6�&F���v���Rr�f��E6��S�2�f��EvV�v�C�c���f�Wr��T&�(ip������F�c���F�c���F�c࢒�У��F�cࢗР���v��F�����Ч�F�F�vW2�bb���F�b7G��S׷�F�7���vf�W�r�Ɩv�FV�3�v6V�FW"r��W7F�g�6��FV�C�v6V�FW"r�v�b�FF��s�s��r��&v��&�GF�ӢB����'WGF��F�6&�VC׷vR������F��wЦ��6Ɩ6�ײ����'V�6V&6��vR���7Df��FW'2��f��FW'2�Ч7G��S׷�&6�w&�V�C�vR�����UB�$�TS"�6���#�vR����UDTB�r6ffbr�&�&FW#��6�ƖBG�$�$DU'��&�&FW%&F�W3���FF��s�s��#'�r�7W'6�#�vR���v��B����vVBr�w���FW"r�f��EvV�v�C�c�f��E6��S�B���(i&Wf��W0���'WGF����7�7G��S׷�6���#�DU�B�f��EvV�v�C�c�f��E6��S�B���vR�vW��b�F�F�vW7���7���'WGF��F�6&�VC׷vR��F�F�vW2����F��wЦ��6Ɩ6�ײ����'V�6V&6��vR���7Df��FW'2��f��FW'2�Ч7G��S׷�&6�w&�V�C�vR��F�F�vW2���UB�$�TS"�6���#�vR��F�F�vW2��UDTB�r6ffbr�&�&FW#��6�ƖBG�$�$DU'��&�&FW%&F�W3���FF��s�s��#'�r�7W'6�#�vR��F�F�vW2�v��B����vVBr�w���FW"r�f��EvV�v�C�c�f��E6��S�B����W�B(i ���'WGF�����F�cࢗУ��F�cࢗР���)H)H6V&6�F�W6R6�FW2)H)H��У�F�b7G��S׷�&6�w&�V�C�4$B�&�&FW%&F�W3�"�FF��s�s��#�r�&�&FW#��6�ƖBG�$�$DU'����ƃ"7G��S׷��&v��sg�r�f��E6��S�r�f��EvV�v�C�s���6V&6�F�W6R6�FW2v�F���W"f��FW'3���#��7G��S׷��&v��s#�r�6���#��UDTB�f��E6��S�2��৷6V&6�V@��tV6�'WGF���V�2F�B6�FR���WrF"v�F���W"7W'&V�B6V&6�f��FW'2&R�f���VB�p��tV�FW"f��FW'2&�fR�B6V&6���"6Ɩ6��'WGF��F�'&�w6RF�B6�FR��r�wУ��ࠧ�4�DU�4DTt�$�U2���6B�����F�b�W�׶6B��&V��7G��S׷��&v��&�GF�Ӣ#"����F�b7G��S׷�6���#��UDTB�f��E6��S�"�f��EvV�v�C�s�FW�EG&�6f�&ӢwWW&66Rr��WGFW%76��s���&v��&�GF�Ӣ��৶6B��&V�У��F�c��F�b7G��S׷�F�7���vw&�Br�w&�EFV��FT6��V��3�w&WVB�WF��f����֖����c��g"��r�v����৶6B�6�FW2���6�FR�����WB�&Vb�r2p�G'���&Vb�6�FR�W&6�FTf��FW'2��6F6���6����Ч&WGW&������W�׷6�FR���WЦ�&Vc׶�&VgЧF&vWC�%�&�� �&V��&���V�W"��&VfW'&W" �7G��S׷��F�7���vf�W�r��Ɩv�FV�3�v6V�FW"r��v�r��FF��s�s�7�r��&6�w&�V�C�G�6�FR�6���'�f��&�&FW#��6�ƖBG�6�FR�6���'�SV��&�&FW$�VgC�7�6�ƖBG�6�FR�6���'���&�&FW%&F�W3����6���#�DU�B��f��E6��S�2��f��EvV�v�C�c��FW�DFV6�&F���v���Rr���fW&f��s�v��FFV�r��FW�D�fW&f��s�vV�Ɨ6�2r��v��FU76S�v��w&r��֖�V�v�C�CB���У��7�7G��S׷�f��E6��S�b�f�W�6�&�波���6�FR�V�������7���7�7G��S׷��fW&f��s�v��FFV�r�FW�D�fW&f��s�vV�Ɨ6�2r���6�FR���W���7����࢐�җУ��F�c���F�c࢒�У��F�cࠧ��)H)HV�G�7F'B7FFR)H)H��Ч�6V&6�VBbb��F��rbb���F�b7G��S׷�FW�DƖv�v6V�FW"r�FF��s�s3g�#�r�6���#��UDTB����F�b7G��S׷�f��E6��S�C"��&v��&�GF�Ӣ���	�H���F�c��F�b7G��S׷�f��E6��S���6���#�DU�B��&v��&�GF�Ӣb���V�FW"��R�B��FV�F�6V&6���F�c��F�b7G��S׷�f��E6��S�2���vWB���vW&VB�T&���F�'2Ɨ7F��w2��"6Ɩ6��6�FR&V��rF�'&�w6RF�&V7Fǒ���F�c���F�cࢗР���F�c���F�c࢐��
