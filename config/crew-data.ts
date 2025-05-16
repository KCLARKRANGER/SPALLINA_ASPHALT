// Define crew members with their rates
export const crewMembers = [
  { id: "matt", name: "Matt Shay", title: "Foreman", rate: 50.54, overtimeRate: 75.81 }, 
  { id: "cole", name: "Cole", title: "Operator", rate: 39.9, overtimeRate: 59.85 },
  { id: "bryan", name: "Bryan", title: "Screedman", rate: 37.24, overtimeRate: 55.86 },
  { id: "dean", name: "Dean", title: "Screedman", rate: 38.57, overtimeRate: 57.86 },
  { id: "adam", name: "Adam", title: "Operator", rate: 33.25, overtimeRate: 49.88 },
  { id: "holden", name: "Holden", title: "Laborer", rate: 31.92, overtimeRate: 47.88 },
  { id: "craig", name: "Craig", title: "Laborer", rate: 26.6, overtimeRate: 39.9 },
  { id: "dustin", name: "Dustin", title: "Operator", rate: 46.55, overtimeRate: 69.83 },
  { id: "jordan", name: "Jordan", title: "Operator", rate: 39.9, overtimeRate: 59.85 },
  { id: "jesse", name: "Jesse", title: "Operator", rate: 33.25, overtimeRate: 49.88 }
]

// Get unique job titles from crew members
export const jobTitles = Array.from(new Set(crewMembers.map((member) => member.title)))

// Get crew members by title
export const getCrewMembersByTitle = (title: string) => {
  return crewMembers.filter((member) => member.title === title)
}

// Get crew member by ID
export const getCrewMemberById = (id: string) => {
  return crewMembers.find((member) => member.id === id)
}
