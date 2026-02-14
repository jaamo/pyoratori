# Technical Specification: Bicycle Flea Market Platform

## 1\. Project Overview

A specialized peer-to-peer marketplace for bicycles, components, and gear. The platform emphasizes a high-quality search experience driven by a strict category-to-attribute mapping.

**Service Name:** pyoratori.com

## 2\. Technical Requirements

-   **Framework:** Next.js (App Router) with TypeScript, shadcn/ui, Tailwind CSS v4
    
-   **Database:** SQLite via `better-sqlite3`, Drizzle ORM
    
-   **Authentication:** Custom Auth system or Auth.js/Clerk. Must support Login, Registration, and **Forgot Password** workflows.
    
-   **Image Processing:** Automated scaling/optimization of uploaded photos for performance.
    
-   **Storage:** Store images to local server disk.
    
-   **Runtime:** Bun
    
-   **Language:** TypeScript (functional style, no classes)
    

## 3\. Data Model & Lifecycle

-   **Postings:**
    
    -   Valid for **6 months** from creation.
        
    -   Status: Active, Expired, or Sold.
        
-   **Product Schema:**
    
    -   Base: `id`, `author_id`, `title`, `description`, `price`, `location`, `category_id`, `created_at`.
        
    -   Media: `images[]` (URLs to optimized assets).
        
    -   Attributes: JSONB/JSON column containing key-value pairs specific to the category.
        

## 4\. Feature Set

### 4.1 User System

-   **Auth:** Register, Login, Logout, and Password Reset.
    
-   **Profile:** A dedicated view for users to manage their own active and past postings.
    
-   **Author Permissions:** Authors can **Edit** or **Delete** their own postings. No admin review process; live on submission.
    

### 4.2 Posting Workflow

-   **Form Fields:** Title, Category, Photos, Description, Price, Location, and Dynamic Attributes.
    
-   **Form Logic:** Once a category is selected, the form must render specific fields from a fixed selection of bicycle attributes.
    
-   **Image Handling:** Performance scaling of photos during the upload process.
    

### 4.3 Search & Discovery (Homepage)

-   **Flexible Search Interface:**
    
    -   **Category Pills:** Horizontal scroll/list of top-level categories.
        
    -   **Detailed Filters:** Selecting a category reveals attribute-specific filters (e.g., "Wheel Size" appears only for MTB/Wheels).
        
-   **Search Notifications:** Possibility to create notifications/alerts based on a saved search.
    

### 4.4 Internal Messaging System

-   **Architecture:** 1-to-1 private messaging system between buyers and sellers.
    
-   **Requirements:**
    
    -   Users must be authenticated to send or receive messages.
        
    -   Postings include a "Message to Seller" button that initiates a conversation thread linked to that specific item.
        
-   **Data Schema:**
    
    -   `Conversations`: Tracks threads between two users (`participant_a`, `participant_b`) and the associated `item_id`.
        
    -   `Messages`: Stores content, `sender_id`, timestamp, and read status.
        
-   **UI/UX:**
    
    -   Inbox view showing a list of active conversations with latest message snippets.
        
    -   Chat interface with real-time updates (via polling or WebSockets).
        
    -   Email notifications for new messages (optional).
        

## 5\. Taxonomy & Categories (Exact)

### 1\. Complete Bicycles

-   **Tasamaapyörät (Road & Paved Surface)**
    
    -   Triathlon / Time Trial (Aika-ajo)
        
    -   Road (Maantie)
        
    -   Cyclocross / Gravel
        
    -   Hybrid / Fitness
        
    -   Track (Rata)
        
-   **Maastopyörät (Mountain Bikes)**
    
    -   Rigid (Joustamattomat)
        
    -   Fatbikes
        
    -   Hardtail (Etujousitetut)
        
    -   Full Suspension (80–125mm travel)
        
    -   Full Suspension (130–155mm travel)
        
    -   Full Suspension (160–185mm travel)
        
    -   Full Suspension (190–210mm travel)
        
-   **Peruspyörät (Standard/City Bikes)**
    
    -   Children’s bikes (Lasten)
        
    -   Single-speed (Yksivaihteiset)
        
    -   Internal Hub Gears (Napavaihteiset)
        
    -   Derailleur Gears (Ketjuvaihteiset)
        
-   **Sähköpyörät (E-Bikes)**
    
    -   Road/Paved (Tasamaa)
        
    -   Mountain (Maasto)
        
    -   Other e-bikes (Muut)
        
-   **Muut pyörät (Other Speciality)**
    
    -   Fixed Gear (Fiksit)
        
    -   Vintage / Retro
        
    -   BMX
        
    -   Dirt / Street
        
    -   Cargo Bikes (Tavarapyörät)
        
    -   Miscellaneous (Muille osastoille sopimattomat)
        

### 2\. Components & Parts (Osat)

-   **Frames:** Includes framesets.
    
-   **Forks and Shocks:** Suspension and rigid forks.
    
-   **Wheels:** Rims, spokes, axles, hubs, rim tape, and wheelsets.
    
-   **Tires:** Inner tubes and outer tires.
    
-   **Saddles and Posts:** Saddles, seatposts, and seat clamps.
    
-   **Handlebars and Stems:** Grips, spacers, and headsets.
    
-   **Drivetrain:** Derailleurs, cables, cranks, bottom brackets, chains, pedals, chainrings, and guides.
    
-   **Brakes:** Rim brakes, disc brakes, rotors, pads, and adapters.
    
-   **Electric Components:** Motors, chargers, batteries, displays, control units, sensors, and cables.
    

### 3\. Gear & Equipment (Varusteet)

-   **Clothing:** Tops, bottoms, eyewear, and warmers.
    
-   **Helmets and Protection:** Helmets and body armor.
    
-   **Shoes:** Cycling-specific and related footwear.
    
-   **Electronics:** Meters, lights, GPS units, cameras, and indoor trainers.
    
-   **Other:** Bags, trailers, tools, fenders, backpacks, locks, and racks.
