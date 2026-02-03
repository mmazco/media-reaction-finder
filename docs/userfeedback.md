# Customer Feedback & Feature Requests

## Raw Customer Feedback

### User 1
> "yes i find it useful. Under Reddit News, if there is a way to bring in the reddit embeds instead of an AI summary of the thread that may feel more natural. Also could be helpful to ban the origin URL from showing up in the Related News results list. From a User Exp. perspective it could be nice to provide a few blocks up top that are examples of what kind of content people can paste into bar! "Content" feels very general so I wasn't sure what it encapsulated, and I think a lot of people have different definitions for 'content'."

**Key Points:**
- ✅ **DONE**: Ban origin URL from results
- 🔴 **HIGH PRIORITY**: Reddit embeds instead of AI summaries
- ✅ **DONE**: Example articles at the top
- Content definition is too vague

---

### User 2
> "1) Looks great on mobile
> 2) The related news + reddit reaction combo is sickkk, but notice reddit reaction doesn't always show up (I assume that's cuz there's no reaction on reddit, but might be good to show the user that that's the case)
> 3) I'd probably use it for summaries and quick links to further discussion, especially if it's reddit vs twitter depending on if you're doxxed on twitter or just prefer reddit"

**Key Points:**
- ✅ Mobile experience is good
- 🟡 **MEDIUM PRIORITY**: Show "No Reddit discussions found" message
- Use case: Quick summaries and discussion links
- Potential for Twitter/X integration

---

### User 3
> "1. Provide a test article so someone could jump straight into it.
> 2. Would love this as a Chrome extension, so I can just hit a hot-key when looking at an article.
> 3. Include bsky reactions!
> 4. tell me which publication I'm going to since I'm clicking out."

**Key Points:**
- ✅ **DONE**: Test articles/examples
- 🟢 **LONG-TERM**: Chrome extension
- 🟢 **LONG-TERM**: Bluesky integration
- 🔴 **HIGH PRIORITY**: Display publication source prominently

---

### User 4
> "one of the Reddit posts had a link as the top comment and the LLM provided 'as an LLM I cannot search the web including the link...' maybe add handling for Reddit posts that contain links
> 
> searching youtube and providing sentiment from video transcripts could be cool?"

**Key Points:**
- 🟡 **MEDIUM PRIORITY**: Better Reddit comment handling (links)
- 🟢 **LONG-TERM**: YouTube transcript sentiment analysis

---

### User 5
> "my first instinct would be turn to chatgpt to explore broader context and implications etc on an article. to use this it would have to be either embedded in the flow from seeing the article to being able to get your output; or to have a high value output that I couldn't get from chat gpt that I would consistently want around a piece of content that I want to dig in on."

**Key Points:**
- Need clear differentiation from ChatGPT
- Value proposition: Real discussion vs AI speculation
- Consider browser extension for workflow integration

---

### User 6
> "I tried a PDF and a tweet but neither worked. I tried Henry's piece on how an ai model sees the world, this one worked better. gonna try and find a more contentious article to try. Had interesting results with a peice from nbc daily about e bike legislation in nyc, where the suggested results were pretty dry partisan stuff, which i interpret as meaning 'this article is basically analogous to partisan kindling'"

**Key Points:**
- 🟡 **MEDIUM PRIORITY**: PDF support
- 🟡 **MEDIUM PRIORITY**: Tweet/X support
- Works well with contentious articles
- Shows political leaning through results

---

### User 7
> "I'd love more reasoning around why I'm being shared the other pieces of content (aka 'unique takes you might've not seen' or 'big picture' categorization).
> 
> My main unanswered question: what am I getting here that I wouldn't get at Perplexity?"

**Key Points:**
- 🔴 **HIGH PRIORITY**: Categorize results with reasoning
- Need to differentiate from Perplexity
- Value prop: Real human reactions vs AI synthesis

---

## Feature Priority Matrix

### ✅ Already Implemented
- [x] Filter out origin URL from results
- [x] Example articles on homepage
- [x] Filter out low-engagement Reddit posts (< 2 comments)
- [x] Display comment counts on Reddit results
- [x] Dark mode support
- [x] Search history/archive

### 🔴 High Priority - Quick Wins (1-2 weeks)

1. **Show "No Reddit discussions found" message**
   - Better UX feedback when Reddit has 0 results
   - Helps users understand why they only see web results

2. **Display publication source prominently**
   - Show domain/source name clearly in web results
   - Users want to know where they're clicking before they click

3. **Result categorization with reasoning**
   - Label results: "Unique Takes", "Mainstream Coverage", "Critical Perspectives"
   - Use AI to explain why results are being shown
   - Differentiates from Perplexity/ChatGPT

4. **Better empty state messaging**
   - Clear feedback when searches return nothing
   - Suggest alternative searches

### 🟡 Medium Priority - High Impact (1-2 months)

5. **Reddit embeds instead of AI summaries** (Most requested!)
   - Show actual Reddit comment threads
   - iframe integration or API-based rendering
   - More authentic than AI summaries

6. **PDF support**
   - Extract text from PDFs
   - Generate reactions for academic papers, reports

7. **Tweet/X support**
   - Handle Twitter/X URLs
   - Find discussions about specific tweets

8. **Better Reddit comment handling**
   - Handle comments with links
   - Avoid "as an LLM I cannot..." errors

### 🟢 Long-term Features (3-6 months)

9. **Chrome Extension**
   - Right-click or hotkey on any article
   - Inline results without leaving page

10. **Bluesky Integration**
    - Find Bluesky discussions
    - Growing alternative to X/Twitter

11. **YouTube Transcript Sentiment**
    - Extract and analyze video transcripts
    - Find sentiment in video reactions

12. **Twitter/X Reactions**
    - Find tweets discussing articles
    - Sentiment analysis of tweet discussions

## Value Proposition vs Competitors

### vs ChatGPT/Perplexity
- **Real discussions** not AI speculation
- **See what actual people** are saying
- **Multiple perspectives** from different communities
- **Social context** (who's discussing, where)

### vs Manual Search
- **One click** instead of multiple searches
- **Curated results** (filtered, categorized)
- **Cross-platform** (web + Reddit + future platforms)
- **Context added** through AI summarization

## Implementation Notes

### Technical Debt
- [ ] Improve article metadata extraction (some sites fail)
- [ ] Better error handling for paywalled content
- [ ] Rate limiting for API calls
- [ ] Caching to reduce API costs

### Analytics to Track
- Which example articles get clicked most
- Which result types users click on (Web vs Reddit)
- Common failed searches (to improve)
- Time to results
- User retention/return visits

## User Quotes (Positive Feedback)

> "The related news + reddit reaction combo is sickkk"

> "yes i find it useful"

> "Looks great on mobile"

> "I'd probably use it for summaries and quick links to further discussion"

---

**Last Updated:** October 20, 2025

