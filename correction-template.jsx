      %% if(TESTMODE) { %%
        TEST TEST TEST
      %% } %%
      <ul>
      %% _.each(corrections, function(c) { %%
        <li class="{{c.severity>=50?'important':''}}">
            <a target="_blank" href="http://{{new URL(BASE_URL).hostname}}{{c.link}}" data-id="{{c.id}}" data-url="{{c.url}}">
<h4>{{new URL(c.url).hostname.replace(/^www\./,'') }}: {{(c.title || '').slice(0,50)}}{{c.title.length>50?'…':''}}</h4>
<p>{{c.update}}</p></a>
        </li>
      %% }) %%
      </ul>

