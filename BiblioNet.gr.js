{
	"translatorID": "7be37def-5761-446b-990d-429cba549d00",
	"label": "BiblioNet.gr",
	"creator": "Alex Tasikas (alexxtasi)",
	"target": "^https?://(?:www\\.){0,1}biblionet\\.gr/(?:book/\\d|index/\\d|(main\\.asp\\?page=results&)|(main\\.asp\\?Pointer=0&esc=0&timestart=\\d))",
	"minVersion": "4.0.8",
	"maxVersion": "null",
	"priority": 100,
	"inRepository": true,
	"translatorType": 4,
	"browserSupport": "gc",
	"lastUpdated": "2013-09-02 02:58:20"
}

/*
   BiblioNet Translator
   for the www.biblionet.gr (Eθνικό Κέντρο Βιβλίου - ΕΚΕΒΙ)
   Copyright (C) 2013 Alex Tasikas, alextasikas@gmail.com

   This program is free software: you can redistribute it and/or modify
   it under the terms of the GNU Affero General Public License as published by
   the Free Software Foundation, either version 3 of the License, or
   (at your option) any later version.

   This program is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU Affero General Public License for more details.

   You should have received a copy of the GNU Affero General Public License
   along with this program. If not, see <http://www.gnu.org/licenses/>.
*/

/*
 * Sample URLs
 * The starting point for a search is the URL below.
 * In testing, I tried the following:
 *
 *   - A search listing of books
 *   - A book page
 *   - A doulist page
 *   - A do page
 *   - A wish page
 *   - A collect page
 */

// RegExp for a book's url - biblio in general (book description or Βibliographic format)
var biblioURL = /^https?:\/\/(?:www\.){0,1}biblionet\.gr\/(?:book\/\d|main.asp\?page=results&Titlesid=\d)/ ;
// RegExp for the null search results
var nullSearch = /^https?:\/\/(?:www\.){0,1}biblionet\.gr\/main\.asp\?page=results&title=&TitleSplit=1&summary=&isbn=&person=&person_ID=&PerKind=0&com=&com_ID=&titlesKind=&from=&untill=&subject=&subject_ID=&series=&low=&high=&OrigLang=&PagesFrom=&PagesTo=&avail_stat=/;
// RegExp for book db types
var bookKind = /titlesKind=0*1/;
// RegExp for ebooks db types
var ebookKind = /titlesKind=11*14/;

function detectWeb(doc, url) {
	// avoid the null search results
	if (!nullSearch.test(url)) {
		// only books (biblios) - (book description or a book's Βibliographic view)
		if (biblioURL.test(url)) {
			return "book";
// till now matches also:
//						- non-book items (it's the same link as books!!)
		}
		// all other cases are multiple results
		else { //if (url.search("&titlesKind=&") != -1 && !bookKind.test(url) && !ebookKind.test(url)) {
			return "multiple";
// till now matches also:
//						- non-books results
//						- no results (not null !!) of whatever kind
//						- one item results (of whatever kind)
		}
	}
}

function doWeb(doc, url) {
		
	if (detectWeb(doc, url) == "multiple") {
		// xpath for the results (actually this is ... 
		// ... the hole table - even with no results!!)
		var xpath = '//table[4]/tbody/tr/td[2]/table';
		
		// the object with the nodes (xPatheResult) we want from the document...
		//var entries = doc.evaluate(xpath, doc, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE , null);
		var entries = doc.evaluate(xpath, doc, null, XPathResult.ANY_TYPE, null);
		
		// entry is just an element (node) of the entries Object
		var entry;

		// parse each node and pass values to the availabe Object
		var available = new Object();
		
		while (entry = entries.iterateNext()) {
			
			// get rid of the first node (no entry) | or extract data from it
			//		using scrapeNode (so you get the title clearly!!!)
			//
			//		- number of results
			//		- type of entries
			//		- non-book
			//		- one item
			//		- no result
			// ###################
			//		TO DO
			
			// for each node extract the booklink
			var booklinkxpath = 'a[@class="booklink"][1]/@href';
			//var booklinkxpath = '//table[4]/tbody/tr[1]/td[2]/table[19]/tbody/tr/td[2]/a[1]/@href';
			var booklink = Zotero.Utilities.xpathText(entry,booklinkxpath);
			//var booklink = doc.evaluate(booklinkxpath,entry,null,XPathResult.STRING_TYPE,null);
			Zotero.debug("\tlink ==>\t" + booklink + "\n");
			
			// create the book's url ('www.biblionet.gr' + booklink)
			var bookurl = "www.biblionet.gr" + booklink;
			Zotero.debug("\turl ==>\t" + bookurl + "\n");
			
			// title extraction
			//titlexpath = 'a[@class="booklink"][1]';
			titlexpath = 'a[@class="booklink" and contains(@href,"/book/")]';
			var title = Zotero.Utilities.xpathText(entry,titlexpath);
			Zotero.debug("\ttitle ==>\t" + title + "\n");
			
			// author extraction
			authorxpath = 'a[@class="booklink" and contains(@href,"/author/")]';
			var author = Zotero.Utilities.xpathText(entry,authorxpath);
			Zotero.debug("\tauthor ==>\t" + author + "\n");
			
			// maybe the xpathText doesn't work ????
			//var title = doc.evaluate(titlexpath, entry, null, XPathResult.ANY_TYPE, null);
			
			// should be like this...
			// or even like... .trimInternal(title + "|" + author + "|" + year...)
			//available[bookurl] = Zotero.Utilities.trimInternal(title);
			available[bookurl] = Zotero.Utilities.trimInternal(entry.textContent);
			
			// print to debug
			Zotero.debug(available[bookurl]);
			Zotero.debug("\n###########\t- next entry -\t###########\n");
		}
		
		// the selection window appears
		var items = new Array();
		Zotero.selectItems(available, function(available) {
			if (!available) return true;
			for (var i in available) {
				items.push(i);
				Zotero.debug("inside selectItems : "+i);
			}
		});
		
		// scrape function will extract info and Zotero would return
		// only those checked by the user
		Zotero.Utilities.processDocuments(items, scrapeΒibliographic, function() {Zotero.done();});
		Zotero.wait();
	}
	else if (detectWeb(doc, url) == "book") {
		// check whether the detectWeb's result ("book") comes from a book's link
		// or a book's biblioView link
		var bookURL = /^https?:\/\/(?:www\.){0,1}biblionet\.gr\/book\/\d/;
		if (bookURL.test(url)) {
			scrapeBook(doc, url);			
		}
		else {
			scrapeΒibliographic(doc, url);
		}
	}
	else {
		// TO DO
		throw "doWeb --> an unsupported zotero type is returned!!\n\t\t\tnot a book nor a biblioView";
		// anything else here??????
	}
	// return; ??? in case of crashing ??
}

/*
*	The function used to add well formatted data to Zotero item
*/
function associateData (newItem, items, field, zoteroField) {
	if (items[field]) {
		newItem[zoteroField] = items[field];
	}
/*function associateData (newItem, dataTags, field, zoteroField) {
	if (dataTags[field]) {
		newItem[zoteroField] = dataTags[field];
	}
}*/
}

/*
*	scpares just one node of information (the best case)
*/
function scrapeNode(doc, url) {
	// the creation of namespace and namespace resolber
	// ????????????????????
	var namespace = doc.documentElement.namespaceURI;
	var nsResolver = namespace ? function(prefix) {
		if (prefix == 'x') return namespace; else return null;
	} : null;
	
	var newItem = new Zotero.Item("book");
	newItem.url = doc.location.href;
	//newItem.title = "No Title Found";

	//check the proccess
	Zotero.debug("just before complete");
	
	//newItem.complete();
}

/*
*	scpares just a Text node of information
*/
function scrapeTextNode(doc, url) {

	//check the proccess
	Zotero.debug("just before complete");
	
	//newItem.complete();
}

/*
*	scpares the page dedicated to one book
*/
function scrapeBook(doc, url) {
	
	//the xpath way!!!
	xpath = '//table[4]/tbody/tr[1]/td[2]/table[2]/tbody/tr[1]/td/table/tbody/tr[2]/td[2]';
	var info = Zotero.Utilities.xpath(doc,xpath);
	
	// title extraction
	// ###################
	//		TO DO
	// consider title - short title
	titlexpath = 'h1[@class="book_title"]';
	var title = Zotero.Utilities.xpathText(info,titlexpath);
	//Zotero.debug("\ttitle ==>\t" + title + "\n");

	
	// author extraction
	// ... strange... this xpath does not fire the same results!!!!
	//authorxpath = 'a[@class="booklink" and contains(@href,"/author/")]';
	authorxpath = 'a[contains(@href,"/author/")]';
	var author = Zotero.Utilities.xpathText(info,authorxpath);
	//Zotero.debug("\tauthor ==>\t" + author + "\n");
	
	// publisher extraction
	//publisher info are "allways" in the last class="booklink" attribute
	// ###################
	//		TO DO
	// extract non attribute data like e-book... child::text() ????
	//	span[@class="book_details"]
	//publisherxpath = 'a[@class="booklink"][last()]';
	publisherxpath = 'a[@class="booklink" and contains(@href,"/com/")]';
	var publisher = Zotero.Utilities.xpathText(info,publisherxpath);
	
	// details extraction
	// ###################
	//		TO DO
	//detailsxpath = 'span[@class="book_details"]';
	detailsxpath = '//table[4]/tbody/tr[1]/td[2]/table[2]/tbody/tr[1]/td/table/tbody/tr[2]/td[2]/span';
	var details = Zotero.Utilities.xpathText(info,detailsxpath);
	Zotero.debug("\tdetails ==>\t" + details + "\n");
	// ###################
	//		TO DO
	// for the ISBN extract the part of the string between "ISBN" and ","
	//		.... and then trim it (or "ISBN-13" !!!)
	// for the year and no.pages extract the part of the string between the
	//		.... first "," and "σελ."
	//		.... trim them
	//		.... year - the first 4 chars
	//		.... pages - the rest
	
	
	// abstract extraction
	// ###################
	//		TO DO
	// experiment with this xpath !!!!!!
	//xpath = '//table[4]/tbody/tr[1]/td[2]/table[2]/tbody/tr[3]/td/table/tbody/tr[1]/td/p';
	xpath = '//table[4]/tbody/tr[1]/td[2]/table[2]/tbody/tr[3]/td/table/tbody/tr[1]';
	var abstract = Zotero.Utilities.xpathText(info,xpath);
	// ###################
	//		TO DO
	// get rid of the html formating tags!!!!! (<br/>)
	abstract = Zotero.Utilities.trimInternal(abstract);

	// tags extraction !!!
	// ###################
	//		TO DO
	//extract those "index - category" links using ...
	// "//table[4]/tbody/tr[1]/td[2]/table[2]/tbody/tr[2]/td/div/table/tbody/tr/td/a[1]"
	// and
	// "//table[4]/tbody/tr[1]/td[2]/table[2]/tbody/tr[2]/td/div/table/tbody/tr/td/a[2]"
	// xpath
	
	// attachments extraction !!! (eg picture!!!)
	// ###################
	//		TO DO

	//saving all info to the newItem...
	// maybe use the associateData (newItem, items, field, zoteroField) function!!
	var newItem = new Zotero.Item("book");
	newItem.title = title;
	// ###################
	//		TO DO
	// consider the case of translator or other info!!!!!
	if (author.match(",")) {
			// ###################
			//		TO DO
			// conseder the case of two lastnames... with - !!!!!
			// maybe the author string should be created with a special delimiter...
		var authors = author.split(",");
		for (var i in authors) {
			newItem.creators.push(Zotero.Utilities.cleanAuthor(authors[i], "author"));
			//newItem.creators.push(authors[i]);
		}
	}
	else {
		newItem.creators.push(Zotero.Utilities.cleanAuthor(author, "author"));
	}
	newItem.publisher = publisher;
	newItem.abstract = abstract;
	
	//close the item and save
	newItem.complete();
}

/*
*	scpares the page with BiblinNet's bibliographic view format
*/
function scrapeΒibliographic(doc, url) {
	
	//the xpath way!!!
	xpath = '//table[4]/tbody/tr[1]/td[2]/table[2]/tbody/tr/td[2]';
	var info = Zotero.Utilities.xpath(doc,xpath);
	
	// title extraction
	// ###################
	//		TO DO
	// consider title - short title ????
	titlexpath = 'a[@class="booklink" and contains(@href,"/book/")]';
	var title = Zotero.Utilities.xpathText(info,titlexpath);
	//Zotero.debug("\ttitle ==>\t" + title + "\n");
	
	// author extraction
	authorxpath = 'a[@class="booklink" and contains(@href,"/author/")]';
	var author = Zotero.Utilities.xpathText(info,authorxpath);
	//Zotero.debug("\tauthor ==>\t" + author + "\n");
	
	// publisher extraction
	//publisher info are "allways" in the last class="booklink" attribute ???
	// ###################
	//		TO DO
	// extract non attribute data like e-book... child::text() ????
	//	span[@class="book_details"]
	//publisherxpath = 'a[@class="booklink"][last()]';
	publisherxpath = 'a[@class="booklink" and contains(@href,"/com/")]';
	var publisher = Zotero.Utilities.xpathText(info,publisherxpath);
	//Zotero.debug("\tpublisher ==>\t" + publisher + "\n");
	
	// ISBN extraction
	// ###################
	//		TO DO
	//isbnxpath = 'span[@class="book_details"]';
	isbnxpath = '//table[4]/tbody/tr[1]/td[2]/table[2]/tbody/tr/td[2]/span';
	var isbn = Zotero.Utilities.xpathText(info,isbnxpath);
	Zotero.debug("\tISBN ==>\t" + isbn + "\n");
	// ###################
	//		TO DO
	// for the ISBN extract the part of the string between "ISBN" and ","
	//		.... and then trim it (or "ISBN-13" !!!)	
	
	
	// details extraction
	// ###################
	//		TO DO
	// maybe the hole node to string and then extract the text between publisher and the end !!!
	//detailsxpath = '//table[4]/tbody/tr[1]/td[2]/table[2]/tbody/tr/td[2]/span';
	detailsxpath = '//table[4]/tbody/tr[1]/td[2]/table[2]/tbody/tr/td[2]';
	var details = Zotero.Utilities.xpathText(info,detailsxpath);
	Zotero.debug("\tdetails ==>\t" + details + "\n");
	// for the year and no.pages extract the part of the node between the
	// end of the <com> and the end of the node
	//		.... trim them
	//		.... year - the first 4 chars
	//		....then there is a "-"
	//		.... pages - the rest (until ".σ")
	
	
	// abstract extraction
	//		NO ABSTRACT !!!
	// ###################
	//		TO DO
	// experiment with this xpath !!!!!!
	//xpath = '//table[4]/tbody/tr[1]/td[2]/table[2]/tbody/tr[3]/td/table/tbody/tr[1]/td/p';
	//xpath = '//table[4]/tbody/tr[1]/td[2]/table[2]/tbody/tr[3]/td/table/tbody/tr[1]';
	//var abstract = Zotero.Utilities.xpathText(info,xpath);
	// ###################
	//		TO DO
	// get rid of the html formating tags!!!!! (<br/>)
	//abstract = Zotero.Utilities.trimInternal(abstract);

	// tags extraction !!!
	// ###################
	//		TO DO
	
	// attachments extraction !!! (eg picture!!!)
	// ###################
	//		TO DO

	//saving all info to the newItem...
	// maybe use the associateData (newItem, items, field, zoteroField) function!!
	var newItem = new Zotero.Item("book");
	newItem.title = title;
	// ###################
	//		TO DO
	// consider the case of translator or other info!!!!!
	if (author.match(",")) {
			// ###################
			//		TO DO
			// conseder the case of two lastnames... with - !!!!!
			// maybe the author string should be created with a special delimiter...
		var authors = author.split(",");
		for (var i in authors) {
			newItem.creators.push(Zotero.Utilities.cleanAuthor(authors[i], "author"));
			//newItem.creators.push(authors[i]);
		}
	}
	else {
		newItem.creators.push(Zotero.Utilities.cleanAuthor(author, "author"));
	}
	newItem.publisher = publisher;
	//newItem.abstract = abstract;
	
	//close the item and save
	newItem.complete();


	// ###################
	//		TO DO
	// 1 - extract the link and pass it to scrapeBook (maybe you should create a doc!!)
	//var booklinkxpath = 'a[@class="booklink"][1]/@href';
	//var booklink = Zotero.Utilities.xpathText(info,booklinkxpath);
	//Zotero.debug("\tlink ==>\t" + booklink + "\n");
	// 2 - create the book's url ('www.biblionet.gr' + booklink)
	//var bookurl = "www.biblionet.gr" + booklink;
	//Zotero.debug("\turl ==>\t" + bookurl + "\n");
	// 3 - create a doc object from this new url
	// TEST !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	//var req = new XMLHttpRequest();
	//req.open("GET", "http://www.biblionet.gr/main.asp?page=results&Titlesid=150890", false);
	//req.send(null);
	//doc = req.responseXML;
	//var newdoc = document.implementation.createDocument(bookurl,'html',null);
	// TEST !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	// 4 - call scrapeBook(doc,bookurl) with the new values...
	//doc.location = bookurl;
	//Zotero.debug(doc);
	//scrapeBook(doc,bookurl);
	// 5 - return; ??? in case of crashing ??
}
